import { onlineManager } from "@tanstack/react-query";

import { useMockNetworkStore } from "@/services/mock-api/mock-network.store";
import { MockServer } from "@/services/mock-api/mock-server";

import { createMockShifts } from "@/mocks/shifts";
import { DEMO_STORE_ID } from "@/mocks/store";
import { ApiError } from "@/types/api-error";

import { mockOrders, TEST_NOW } from "@test/order-test-utils";
import { ROSTER_NOW } from "@test/roster-test-utils";
import { signInAs, signOutForTest } from "@test/session-test-utils";

const orderOf = async (id: string) =>
  (await MockServer.getOrders(DEMO_STORE_ID)).find((o) => o.id === id);

/** Resolves to the ApiError code a request failed with. */
async function failureCode(request: Promise<unknown>): Promise<string> {
  try {
    await request;
  } catch (error) {
    return error instanceof ApiError ? error.code : "NOT_AN_API_ERROR";
  }
  return "DID_NOT_FAIL";
}

beforeEach(async () => {
  onlineManager.setOnline(true);
  useMockNetworkStore.getState().reset();
  signInAs("manager");
  await MockServer.seedForTest({
    now: TEST_NOW,
    orders: mockOrders(),
    shifts: createMockShifts(ROSTER_NOW),
  });
});

afterEach(() => {
  onlineManager.setOnline(true);
  jest.restoreAllMocks();
});

describe("MockServer requests", () => {
  it("fails with a network error while the device is offline", async () => {
    onlineManager.setOnline(false);
    expect(await failureCode(MockServer.getOrders(DEMO_STORE_ID))).toBe(
      "NETWORK",
    );
  });

  it("fails some requests with a server error when asked to", async () => {
    useMockNetworkStore.getState().setFailRequests(true);
    jest.spyOn(Math, "random").mockReturnValue(0);
    expect(await failureCode(MockServer.getOrders(DEMO_STORE_ID))).toBe(
      "SERVER_ERROR",
    );

    jest.spyOn(Math, "random").mockReturnValue(0.9);
    expect(await MockServer.getOrders(DEMO_STORE_ID)).toHaveLength(20);
  });

  it("returns copies, so callers never change server data by accident", async () => {
    const [first] = await MockServer.getOrders(DEMO_STORE_ID);
    if (first) {
      first.status = "CANCELLED";
    }
    expect((await orderOf(first?.id ?? ""))?.status).not.toBe("CANCELLED");
  });
});

describe("MockServer orders", () => {
  it("applies a change with the shared rules and raises the version", async () => {
    const before = await orderOf("ORD-7846");
    const updated = await MockServer.updateOrder({
      command: { type: "START_PICKING" },
      expectedVersion: before?.version ?? 0,
      orderId: "ORD-7846",
    });

    expect(updated.status).toBe("PICKING");
    expect(updated.version).toBe((before?.version ?? 0) + 1);
    expect((await orderOf("ORD-7846"))?.status).toBe("PICKING");
  });

  it("rejects a change based on an old version with a 409", async () => {
    const before = await orderOf("ORD-7846");
    const stale = MockServer.updateOrder({
      command: { type: "START_PICKING" },
      expectedVersion: (before?.version ?? 0) - 1,
      orderId: "ORD-7846",
    });

    expect(await failureCode(stale)).toBe("VERSION_CONFLICT");
    expect((await orderOf("ORD-7846"))?.status).toBe("NEW");
  });

  it("rejects a change the rules do not allow", async () => {
    const order = await orderOf("ORD-7846");
    const readyTooSoon = MockServer.updateOrder({
      command: { type: "MARK_READY" },
      expectedVersion: order?.version ?? 0,
      orderId: "ORD-7846",
    });
    expect(await failureCode(readyTooSoon)).toBe("VALIDATION");
  });
});

describe("MockServer module copies", () => {
  it("shares one data set between copies of the module, as Fast Refresh creates in development", async () => {
    // Fast Refresh re-evaluates an edited module. The copy behind the queries must see changes
    // made through the copy behind the mutations, or every later change is a version conflict.
    let copy: typeof MockServer | undefined;
    jest.isolateModules(() => {
      copy = (
        jest.requireActual("@/services/mock-api/mock-server") as {
          MockServer: typeof MockServer;
        }
      ).MockServer;
    });
    expect(copy).toBeDefined();
    expect(copy).not.toBe(MockServer);

    const before = await orderOf("ORD-7846");
    await MockServer.updateOrder({
      command: { type: "START_PICKING" },
      expectedVersion: before?.version ?? 0,
      orderId: "ORD-7846",
    });

    const seenByCopy = (await copy?.getOrders(DEMO_STORE_ID))?.find(
      (o) => o.id === "ORD-7846",
    );
    expect(seenByCopy?.version).toBe((before?.version ?? 0) + 1);
  });
});

describe("MockServer roster", () => {
  const draft = {
    employeeId: "emp-06",
    endAt: new Date(2026, 9, 12, 17).toISOString(),
    startAt: new Date(2026, 9, 12, 9).toISOString(),
    unpaidBreakMinutes: 30,
  };

  it("creates a shift once, even if the request is sent twice", async () => {
    const shift = { ...draft, id: "shift-test", storeId: DEMO_STORE_ID };
    const count = (await MockServer.getShifts(DEMO_STORE_ID)).length;

    await MockServer.createShift(shift);
    await MockServer.createShift(shift);

    expect(await MockServer.getShifts(DEMO_STORE_ID)).toHaveLength(count + 1);
  });

  it("validates shifts with the same rules as the editor", async () => {
    const overlapping = await MockServer.getShifts(DEMO_STORE_ID);
    const [existing] = overlapping;
    const clash = {
      ...draft,
      employeeId: existing?.employeeId ?? "",
      endAt: existing?.endAt ?? "",
      id: "shift-clash",
      startAt: existing?.startAt ?? "",
      storeId: DEMO_STORE_ID,
    };
    expect(await failureCode(MockServer.createShift(clash))).toBe("VALIDATION");
  });

  it("treats removing a missing shift as done", async () => {
    await expect(MockServer.deleteShift("no-such-shift")).resolves.toBe(
      undefined,
    );
  });
});

describe("MockServer pay rates", () => {
  it("returns pay rates to managers only", async () => {
    expect(
      (await MockServer.getPayRates(DEMO_STORE_ID)).length,
    ).toBeGreaterThan(0);

    signInAs("shiftLeader");
    expect(await failureCode(MockServer.getPayRates(DEMO_STORE_ID))).toBe(
      "FORBIDDEN",
    );

    signOutForTest();
    expect(await failureCode(MockServer.getPayRates(DEMO_STORE_ID))).toBe(
      "FORBIDDEN",
    );
  });
});

describe("MockServer reset", () => {
  it("restores the demo data set", async () => {
    await MockServer.seedForTest({ now: TEST_NOW, orders: [] });
    await MockServer.reset();

    expect(await MockServer.getOrders(DEMO_STORE_ID)).toHaveLength(20);
    expect((await MockServer.getShifts(DEMO_STORE_ID)).length).toBeGreaterThan(
      0,
    );
  });
});
