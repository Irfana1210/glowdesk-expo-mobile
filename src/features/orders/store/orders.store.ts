/**
 * MVP order state (brief §9), persisted on the device with expo-sqlite's key-value store.
 * All business rules live in the pure domain modules. This store only applies their results.
 *
 * When the Supabase backend arrives, fetched orders move to TanStack Query and this store
 * shrinks to local UI state plus the offline mutation queue.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { LOCALE } from "@/constants/locale";

import { persistStorage, STORAGE_KEYS } from "@/utils/storage";

import { AssignmentUtils } from "@/features/orders/domain/assignment";
import { OrderStateMachine } from "@/features/orders/domain/order-state-machine";
import {
  PickingUtils,
  type PickResult,
} from "@/features/orders/domain/picking";
import { OrdersService } from "@/features/orders/services/orders.service";

import { type Order, type OrderStatus } from "@/types/order";

export type LoadStatus = "idle" | "loading" | "ready" | "error";

export type ActionResult = { ok: true } | { message: string; ok: false };

type States = {
  isRefreshing: boolean;
  loadError: string | null;
  loadStatus: LoadStatus;
  orders: Array<Order>;
};

type Actions = {
  /** Assigns a New or Picking order, or unassigns it when no employee is given. */
  assignOrder: (
    orderId: string,
    employeeId: string | undefined,
  ) => ActionResult;
  cancelOrder: (orderId: string) => ActionResult;
  loadOrders: () => Promise<void>;
  markReady: (orderId: string) => ActionResult;
  refreshOrders: () => Promise<void>;
  resetDemoData: () => Promise<void>;
  scanItem: (orderId: string, barcode: string) => PickResult;
  startPicking: (orderId: string) => ActionResult;
};

export const ORDERS_STORAGE_KEY = STORAGE_KEYS.orders;
/**
 * v2: demo orders were replaced with the design-handoff data set (same IDs, different products).
 * Older saved demo orders are dropped rather than mixed with the new ones.
 */
export const ORDERS_STORAGE_VERSION = 2;

const PRIORITY_RANK = { HIGH: 0, STANDARD: 1 } as const;

export function sortOrders(orders: Array<Order>): Array<Order> {
  return [...orders].sort(
    (a, b) =>
      PRIORITY_RANK[a.priority ?? "STANDARD"] -
        PRIORITY_RANK[b.priority ?? "STANDARD"] ||
      b.createdAt.localeCompare(a.createdAt),
  );
}

/**
 * Combines two copies of the order set. Orders present in only one copy are kept, and when
 * both have an order the higher version wins (local wins ties). Refreshes and app restarts
 * therefore never discard picking progress.
 */
export function mergeByVersion(
  local: Array<Order>,
  incoming: Array<Order>,
): Array<Order> {
  const merged = new Map(incoming.map((order) => [order.id, order]));
  for (const order of local) {
    const other = merged.get(order.id);
    if (!other || order.version >= other.version) {
      merged.set(order.id, order);
    }
  }
  return [...merged.values()];
}

const ORDER_STATUSES: ReadonlyArray<OrderStatus> = [
  "NEW",
  "PICKING",
  "READY",
  "COLLECTED",
  "CANCELLED",
];

/** Guards against corrupted or outdated data on disk. Invalid records are dropped, not trusted. */
export function isPersistedOrder(value: unknown): value is Order {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const o = value as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.storeId === "string" &&
    typeof o.customerInitials === "string" &&
    typeof o.createdAt === "string" &&
    typeof o.version === "number" &&
    ORDER_STATUSES.includes(o.status as OrderStatus) &&
    Array.isArray(o.items) &&
    o.items.every(
      (i: unknown) =>
        typeof i === "object" &&
        i !== null &&
        typeof (i as OrderItemLike).id === "string" &&
        typeof (i as OrderItemLike).barcode === "string" &&
        typeof (i as OrderItemLike).requiredQuantity === "number" &&
        typeof (i as OrderItemLike).pickedQuantity === "number",
    )
  );
}
type OrderItemLike = {
  barcode?: unknown;
  id?: unknown;
  pickedQuantity?: unknown;
  requiredQuantity?: unknown;
};

function errorMessage(error: unknown): string {
  if (error instanceof OrderStateMachine.OrderTransitionError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return LOCALE.orders.store.genericError;
}

/** Resolves once saved orders have been read from disk, so a fetch never races hydration. */
function waitForHydration(): Promise<void> {
  if (useOrdersStore.persist.hasHydrated()) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const unsubscribe = useOrdersStore.persist.onFinishHydration(() => {
      unsubscribe();
      resolve();
    });
  });
}

export const useOrdersStore = create<States & Actions>()(
  persist(
    (set, get) => {
      const replaceOrder = (updated: Order) =>
        set({
          orders: get().orders.map((order) =>
            order.id === updated.id ? updated : order,
          ),
        });

      const applyTransition = (
        orderId: string,
        transition: (order: Order) => Order,
      ): ActionResult => {
        const current = get().orders.find((order) => order.id === orderId);
        if (!current) {
          return { ok: false, message: LOCALE.orders.store.orderNotFound };
        }
        try {
          replaceOrder(transition(current));
          return { ok: true };
        } catch (error) {
          return { ok: false, message: errorMessage(error) };
        }
      };

      return {
        orders: [],
        loadStatus: "idle",
        loadError: null,
        isRefreshing: false,

        loadOrders: async () => {
          if (get().loadStatus === "loading") {
            return;
          }
          set({ loadStatus: "loading", loadError: null });
          try {
            await waitForHydration();
            const incoming = await OrdersService.fetchOrders();
            set({
              orders: sortOrders(mergeByVersion(get().orders, incoming)),
              loadStatus: "ready",
            });
          } catch (error) {
            // Saved orders are still usable when the fetch fails.
            set({
              loadStatus: get().orders.length > 0 ? "ready" : "error",
              loadError: errorMessage(error),
            });
          }
        },

        refreshOrders: async () => {
          if (get().isRefreshing) {
            return;
          }
          set({ isRefreshing: true });
          try {
            const incoming = await OrdersService.fetchOrders();
            set({
              orders: sortOrders(mergeByVersion(get().orders, incoming)),
              loadStatus: "ready",
              loadError: null,
            });
          } catch (error) {
            set({ loadError: errorMessage(error) });
          } finally {
            set({ isRefreshing: false });
          }
        },

        startPicking: (orderId) =>
          applyTransition(orderId, OrderStateMachine.startPicking),
        markReady: (orderId) =>
          applyTransition(orderId, OrderStateMachine.markOrderReady),
        assignOrder: (orderId, employeeId) =>
          applyTransition(orderId, (order) =>
            AssignmentUtils.assignOrder(order, employeeId),
          ),
        cancelOrder: (orderId) =>
          applyTransition(orderId, AssignmentUtils.cancelOrder),

        scanItem: (orderId, barcode) => {
          const current = get().orders.find((order) => order.id === orderId);
          if (!current) {
            return {
              ok: false,
              code: "ORDER_NOT_PICKING",
              message: LOCALE.orders.store.orderNotFound,
            };
          }
          const result = PickingUtils.recordPick(current, barcode);
          if (result.ok) {
            replaceOrder(result.order);
          }
          return result;
        },

        resetDemoData: async () => {
          set({ orders: [], loadStatus: "loading", loadError: null });
          try {
            set({
              orders: sortOrders(await OrdersService.fetchOrders()),
              loadStatus: "ready",
            });
          } catch (error) {
            set({ loadStatus: "error", loadError: errorMessage(error) });
          }
        },
      };
    },
    {
      name: ORDERS_STORAGE_KEY,
      version: ORDERS_STORAGE_VERSION,
      migrate: (persisted, fromVersion) =>
        (fromVersion < ORDERS_STORAGE_VERSION ? {} : persisted) as never,
      storage: persistStorage,
      // Only domain data is saved. Loading flags are runtime state.
      partialize: (state) => ({ orders: state.orders }),
      merge: (persisted, current) => {
        const saved = (persisted as { orders?: unknown } | undefined)?.orders;
        const valid = Array.isArray(saved)
          ? saved.filter(isPersistedOrder)
          : [];
        return {
          ...current,
          orders: sortOrders(mergeByVersion(valid, current.orders)),
        };
      },
    },
  ),
);

export const selectOrderById =
  (orderId: string | undefined) => (state: States & Actions) =>
    orderId ? state.orders.find((order) => order.id === orderId) : undefined;
