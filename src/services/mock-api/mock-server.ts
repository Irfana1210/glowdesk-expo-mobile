/**
 * An in-app stand-in for the Glowdesk backend. It owns the canonical orders and shifts, saves
 * them on the device so they survive restarts, and enforces the same rules a real server would:
 * domain validation, version checks on orders and manager-only pay rates.
 *
 * Every call behaves like a network request. It waits, fails when the device is offline, and can
 * fail on purpose when the developer switches in Settings ask it to. Feature services are the only
 * callers, so swapping in a real API changes the services and nothing above them.
 */
import { onlineManager } from "@tanstack/react-query";

import {
  MOCK_LATENCY_MS,
  SLOW_NETWORK_LATENCY_MS,
} from "@/constants/primitives";

import { MockUtils } from "@/utils/mock-utils";
import {
  appStorage,
  RETIRED_STORAGE_KEYS,
  STORAGE_KEYS,
} from "@/utils/storage";

import { AuthUtils } from "@/features/auth/domain/auth";
import { useSessionStore } from "@/features/auth/store/session.store";
import { type Employee } from "@/features/employees/types";
import { type PayRate } from "@/features/labour/types";
import {
  type OrderCommand,
  OrderCommandUtils,
} from "@/features/orders/domain/order-commands";
import { ShiftUtils } from "@/features/roster/domain/shifts";
import { type Shift, type ShiftDraft } from "@/features/roster/types";

import { MOCK_EMPLOYEES } from "@/mocks/employees";
import { createMockOrders } from "@/mocks/orders";
import { MOCK_PAY_RATES } from "@/mocks/pay-rates";
import { createMockShifts } from "@/mocks/shifts";
import { ApiError } from "@/types/api-error";
import { type Order, type OrderStatus } from "@/types/order";

import { useMockNetworkStore } from "./mock-network.store";

type MockDb = {
  orders: Array<Order>;
  shifts: Array<Shift>;
};

type SavedDb = MockDb & { schemaVersion: number };

const SCHEMA_VERSION = 1;

const ORDER_STATUSES: ReadonlyArray<OrderStatus> = [
  "NEW",
  "PICKING",
  "READY",
  "COLLECTED",
  "CANCELLED",
];

function isOrder(value: unknown): value is Order {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const o = value as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.storeId === "string" &&
    typeof o.createdAt === "string" &&
    typeof o.version === "number" &&
    ORDER_STATUSES.includes(o.status as OrderStatus) &&
    Array.isArray(o.items)
  );
}

function isShift(value: unknown): value is Shift {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const s = value as Record<string, unknown>;
  return (
    typeof s.id === "string" &&
    typeof s.storeId === "string" &&
    typeof s.employeeId === "string" &&
    typeof s.startAt === "string" &&
    typeof s.endAt === "string" &&
    typeof s.unpaidBreakMinutes === "number"
  );
}

/** Copies data on the way out, like JSON over the wire, so callers never share server objects. */
function clone<T>(value: T): T {
  return value === undefined ? value : (JSON.parse(JSON.stringify(value)) as T);
}

/**
 * Server state lives on the global object, not in this module. In development, Fast Refresh
 * re-evaluates an edited module and its importers, so two copies of this module can be alive at
 * once: one behind the registered mutations, one behind the queries. Both must see the same data,
 * or every change after the first is rejected as a version conflict.
 */
type ServerState = { clock: () => Date; db: Promise<MockDb> | null };

const globalWithState = globalThis as typeof globalThis & {
  __glowdeskMockServer?: ServerState;
};
const state: ServerState = (globalWithState.__glowdeskMockServer ??= {
  clock: () => new Date(),
  db: null,
});

export namespace MockServer {
  function seed(): MockDb {
    const now = state.clock();
    return { orders: createMockOrders(now), shifts: createMockShifts(now) };
  }

  async function load(): Promise<MockDb> {
    const raw = await appStorage.getItem(STORAGE_KEYS.mockServer);
    if (raw) {
      try {
        const saved = JSON.parse(raw) as Partial<SavedDb>;
        if (
          saved.schemaVersion === SCHEMA_VERSION &&
          Array.isArray(saved.orders) &&
          Array.isArray(saved.shifts)
        ) {
          return {
            orders: saved.orders.filter(isOrder),
            shifts: saved.shifts.filter(isShift),
          };
        }
      } catch {
        // Unreadable data is replaced with a fresh demo data set below.
      }
    }
    await Promise.all(
      RETIRED_STORAGE_KEYS.map((k) => appStorage.removeItem(k)),
    );
    const fresh = seed();
    await save(fresh);
    return fresh;
  }

  function data(): Promise<MockDb> {
    state.db ??= load();
    return state.db;
  }

  async function save(next: MockDb): Promise<void> {
    const saved: SavedDb = { ...next, schemaVersion: SCHEMA_VERSION };
    await appStorage.setItem(STORAGE_KEYS.mockServer, JSON.stringify(saved));
  }

  /** Runs a handler like a network round trip: latency, connectivity, then optional failure. */
  async function request<T>(
    handler: (db: MockDb) => T,
    options: { writes?: boolean } = {},
  ): Promise<T> {
    const { failRequests, slowNetwork } = useMockNetworkStore.getState();
    await MockUtils.simulateLatency(
      slowNetwork ? SLOW_NETWORK_LATENCY_MS : MOCK_LATENCY_MS,
    );
    if (!onlineManager.isOnline()) {
      throw new ApiError("NETWORK", "The device is offline.", 0);
    }
    if (failRequests) {
      throw new ApiError("SERVER_ERROR", "Simulated server error.", 503);
    }
    const current = await data();
    const result = handler(current);
    if (options.writes) {
      await save(current);
    }
    return clone(result);
  }

  /** A request with no stored data behind it, such as sign-in, inventory or sales. */
  export function respond<T>(produce: () => T): Promise<T> {
    return request(() => produce());
  }

  // Orders

  export function getOrders(storeId: string): Promise<Array<Order>> {
    return request((d) => d.orders.filter((o) => o.storeId === storeId));
  }

  /**
   * Applies a command to an order. `expectedVersion` is the version the device last saw. If the
   * order has changed since, the change is rejected with a 409 instead of overwriting newer work.
   */
  export function updateOrder(input: {
    command: OrderCommand;
    expectedVersion: number;
    orderId: string;
  }): Promise<Order> {
    return request(
      (d) => {
        const index = d.orders.findIndex((o) => o.id === input.orderId);
        const current = d.orders[index];
        if (!current) {
          throw new ApiError("NOT_FOUND", "Order not found.", 404);
        }
        if (current.version !== input.expectedVersion) {
          throw new ApiError(
            "VERSION_CONFLICT",
            `Order ${current.id} is at version ${current.version}.`,
            409,
          );
        }
        const result = OrderCommandUtils.apply(
          current,
          input.command,
          state.clock(),
        );
        if (!result.ok) {
          throw new ApiError("VALIDATION", result.message, 422);
        }
        d.orders[index] = result.order;
        return result.order;
      },
      { writes: true },
    );
  }

  // Roster

  export function getShifts(storeId: string): Promise<Array<Shift>> {
    return request((d) => d.shifts.filter((s) => s.storeId === storeId));
  }

  function validate(
    d: MockDb,
    draft: ShiftDraft,
    storeId: string,
    editingShiftId?: string,
  ): void {
    const errors = ShiftUtils.validateShift(draft, {
      editingShiftId,
      employees: MOCK_EMPLOYEES,
      now: editingShiftId ? undefined : state.clock(),
      shifts: d.shifts,
      storeId,
    });
    if (ShiftUtils.hasErrors(errors)) {
      const message = Object.values(errors).find(Boolean) ?? "Invalid shift.";
      throw new ApiError("VALIDATION", message, 422);
    }
  }

  /** Creates a shift with the ID the device chose, so a retried request never adds it twice. */
  export function createShift(shift: Shift): Promise<Shift> {
    return request(
      (d) => {
        const existing = d.shifts.find((s) => s.id === shift.id);
        if (existing) {
          return existing;
        }
        validate(d, shift, shift.storeId);
        d.shifts.push(shift);
        return shift;
      },
      { writes: true },
    );
  }

  export function updateShift(input: {
    draft: ShiftDraft;
    shiftId: string;
  }): Promise<Shift> {
    return request(
      (d) => {
        const index = d.shifts.findIndex((s) => s.id === input.shiftId);
        const current = d.shifts[index];
        if (!current) {
          throw new ApiError("NOT_FOUND", "Shift not found.", 404);
        }
        validate(d, input.draft, current.storeId, current.id);
        const updated: Shift = { ...current, ...input.draft };
        d.shifts[index] = updated;
        return updated;
      },
      { writes: true },
    );
  }

  /** Removing a shift that is already gone succeeds, so a replayed delete is harmless. */
  export function deleteShift(shiftId: string): Promise<void> {
    return request(
      (d) => {
        d.shifts = d.shifts.filter((s) => s.id !== shiftId);
      },
      { writes: true },
    );
  }

  // Reference data

  export function getEmployees(): Promise<Array<Employee>> {
    return request(() => MOCK_EMPLOYEES);
  }

  /** Pay rates are for managers only. The server enforces it, as Row Level Security would. */
  export function getPayRates(storeId: string): Promise<Array<PayRate>> {
    return request(() => {
      const session = useSessionStore.getState().session;
      if (
        !session ||
        session.storeId !== storeId ||
        !AuthUtils.canViewPayInformation(session.role)
      ) {
        throw new ApiError("FORBIDDEN", "Managers only.", 403);
      }
      return MOCK_PAY_RATES;
    });
  }

  // Developer tools

  /** Restores the demo data set. */
  export async function reset(): Promise<void> {
    const fresh = seed();
    state.db = Promise.resolve(fresh);
    await save(fresh);
  }

  /** Test helper: the server's data, read directly rather than over the simulated network. */
  export async function snapshotForTest(): Promise<MockDb> {
    return clone(await data());
  }

  /** Test helper: replaces the server data and pins the server clock. */
  export async function seedForTest(input: {
    now: Date;
    orders?: Array<Order>;
    shifts?: Array<Shift>;
  }): Promise<void> {
    state.clock = () => input.now;
    const next: MockDb = {
      orders: input.orders ?? [],
      shifts: input.shifts ?? [],
    };
    state.db = Promise.resolve(next);
    await save(next);
  }
}
