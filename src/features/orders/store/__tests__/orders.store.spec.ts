import Storage from "expo-sqlite/kv-store";

import { OrdersService } from "@/features/orders/services/orders.service";
import {
  isPersistedOrder,
  mergeByVersion,
  ORDERS_STORAGE_KEY,
  sortOrders,
  useOrdersStore,
} from "@/features/orders/store/orders.store";

import { createMockOrders } from "@/mocks/orders";
import { MOCK_PRODUCTS } from "@/mocks/products";

import { mockOrders, resetOrdersStore, TEST_NOW } from "@test/order-test-utils";

jest.mock("@/features/orders/services/orders.service", () => ({
  OrdersService: {
    fetchOrders: jest.fn(),
  },
}));
const mockedFetchOrders = jest.mocked(OrdersService.fetchOrders);

beforeEach(async () => {
  jest.clearAllMocks();
  await Storage.removeItem(ORDERS_STORAGE_KEY);
  resetOrdersStore();
  mockedFetchOrders.mockResolvedValue(mockOrders());
});

describe("mergeByVersion", () => {
  const now = TEST_NOW;

  it("keeps local progress when the local copy has a newer version", () => {
    const remote = createMockOrders(now);
    const local = remote.map((order) =>
      order.id === "ORD-7846"
        ? { ...order, status: "PICKING" as const, version: order.version + 1 }
        : order,
    );

    expect(
      mergeByVersion(local, remote).find((o) => o.id === "ORD-7846")?.status,
    ).toBe("PICKING");
  });

  it("takes the incoming copy when it is newer", () => {
    const local = createMockOrders(now);
    const remote = local.map((order) =>
      order.id === "ORD-7840"
        ? { ...order, status: "COLLECTED" as const, version: order.version + 1 }
        : order,
    );

    expect(
      mergeByVersion(local, remote).find((o) => o.id === "ORD-7840")?.status,
    ).toBe("COLLECTED");
  });

  it("keeps orders that exist in only one copy", () => {
    const [first, second] = createMockOrders(now);
    if (!first || !second) {
      throw new Error("expected mock orders");
    }
    expect(
      mergeByVersion([first], [second])
        .map((o) => o.id)
        .sort(),
    ).toEqual([first.id, second.id].sort());
  });
});

describe("sortOrders", () => {
  it("puts high priority first, then newest first (all demo orders are standard priority)", () => {
    const ids = sortOrders(createMockOrders(TEST_NOW)).map((o) => o.id);
    expect(ids.slice(0, 3)).toEqual(["ORD-7852", "ORD-7851", "ORD-7850"]);
  });
});

describe("isPersistedOrder", () => {
  it("accepts a real order and rejects malformed records", () => {
    expect(isPersistedOrder(mockOrders()[0])).toBe(true);
    expect(isPersistedOrder(null)).toBe(false);
    expect(isPersistedOrder({ id: "x" })).toBe(false);
    expect(isPersistedOrder({ ...mockOrders()[0], status: "SHIPPED" })).toBe(
      false,
    );
  });
});

describe("useOrdersStore actions", () => {
  it("scans an item, updates the order and saves it to storage", async () => {
    await useOrdersStore.getState().loadOrders();

    const result = useOrdersStore
      .getState()
      .scanItem("ORD-7841", MOCK_PRODUCTS.velourBlush.barcode);

    expect(result.ok).toBe(true);
    const order = useOrdersStore
      .getState()
      .orders.find((o) => o.id === "ORD-7841");
    expect(
      order?.items.find((i) => i.sku === MOCK_PRODUCTS.velourBlush.sku)
        ?.pickedQuantity,
    ).toBe(1);

    const saved = JSON.parse(
      (await Storage.getItem(ORDERS_STORAGE_KEY)) ?? "{}",
    );
    const savedOrder = saved.state.orders.find(
      (o: { id: string }) => o.id === "ORD-7841",
    );
    expect(savedOrder.version).toBe(order?.version);
  });

  it("does not change state when a scan is rejected", async () => {
    await useOrdersStore.getState().loadOrders();
    const before = useOrdersStore.getState().orders;

    const result = useOrdersStore
      .getState()
      .scanItem("ORD-7841", MOCK_PRODUCTS.irisParfum.barcode);

    expect(result).toMatchObject({ ok: false, code: "NOT_IN_ORDER" });
    expect(useOrdersStore.getState().orders).toBe(before);
  });

  it("restores saved progress after a restart instead of the fresh server copy", async () => {
    await useOrdersStore.getState().loadOrders();
    useOrdersStore.getState().startPicking("ORD-7846");

    // Simulate a cold start: clear memory, rehydrate from disk, then fetch again.
    // Resetting the store also persists the empty state, so put the saved copy back first.
    const savedOnDisk = await Storage.getItem(ORDERS_STORAGE_KEY);
    resetOrdersStore();
    await Storage.setItem(ORDERS_STORAGE_KEY, savedOnDisk ?? "");
    expect(useOrdersStore.getState().orders).toHaveLength(0);
    await useOrdersStore.persist.rehydrate();
    await useOrdersStore.getState().loadOrders();

    expect(
      useOrdersStore.getState().orders.find((o) => o.id === "ORD-7842")?.status,
    ).toBe("PICKING");
  });

  it("keeps saved orders usable when the fetch fails", async () => {
    resetOrdersStore({ orders: mockOrders() });
    mockedFetchOrders.mockRejectedValueOnce(new Error("Offline"));

    await useOrdersStore.getState().loadOrders();

    expect(useOrdersStore.getState()).toMatchObject({
      loadStatus: "ready",
      loadError: "Offline",
    });
  });

  it("resets demo data back to the original orders", async () => {
    await useOrdersStore.getState().loadOrders();
    useOrdersStore.getState().startPicking("ORD-7846");

    await useOrdersStore.getState().resetDemoData();

    expect(
      useOrdersStore.getState().orders.find((o) => o.id === "ORD-7846")?.status,
    ).toBe("NEW");
  });
});

describe("assignment and cancellation actions", () => {
  it("assigns an order and saves the change", async () => {
    await useOrdersStore.getState().loadOrders();
    expect(useOrdersStore.getState().assignOrder("ORD-7846", "emp-04")).toEqual(
      { ok: true },
    );
    expect(
      useOrdersStore.getState().orders.find((o) => o.id === "ORD-7846")
        ?.assigneeId,
    ).toBe("emp-04");
  });

  it("reports a refused change without altering state", async () => {
    await useOrdersStore.getState().loadOrders();
    const before = useOrdersStore.getState().orders;
    expect(useOrdersStore.getState().cancelOrder("ORD-7840")).toMatchObject({
      ok: false,
    });
    expect(useOrdersStore.getState().assignOrder("ORD-7840", "emp-02")).toEqual(
      {
        ok: false,
        message: "Only New and Picking orders can be reassigned.",
      },
    );
    expect(useOrdersStore.getState().orders).toBe(before);
  });
});
