import {
  ALLOWED_TRANSITIONS,
  canMarkReady,
  canTransition,
  getPickingProgress,
  markOrderReady,
  OrderTransitionError,
  startPicking,
  transitionOrder,
} from "@/features/orders/domain/orderStateMachine";

import { type Order, type OrderItem, type OrderStatus } from "@/types/order";

const item = (overrides: Partial<OrderItem> = {}): OrderItem => ({
  id: "item-1",
  productId: "prod-1",
  sku: "SKU-001",
  barcode: "9300000000017",
  name: "Test Serum",
  requiredQuantity: 2,
  pickedQuantity: 2,
  ...overrides,
});

const order = (overrides: Partial<Order> = {}): Order => ({
  id: "ORD-1",
  storeId: "store-1",
  customerInitials: "AB",
  status: "PICKING",
  version: 3,
  createdAt: "2026-10-10T09:00:00.000+11:00",
  items: [
    item(),
    item({ id: "item-2", requiredQuantity: 1, pickedQuantity: 1 }),
  ],
  ...overrides,
});

const ALL_STATUSES: Array<OrderStatus> = [
  "NEW",
  "PICKING",
  "READY",
  "COLLECTED",
  "CANCELLED",
];

describe("canTransition", () => {
  it.each([
    ["NEW", "PICKING"],
    ["PICKING", "READY"],
    ["READY", "COLLECTED"],
    ["NEW", "CANCELLED"],
    ["PICKING", "CANCELLED"],
  ] as const)("allows %s -> %s", (from, to) => {
    expect(canTransition(from, to)).toBe(true);
  });

  it("allows exactly the five transitions in the brief and nothing else", () => {
    const allowed = ALL_STATUSES.flatMap((from) =>
      ALL_STATUSES.filter((to) => canTransition(from, to)).map(
        (to) => `${from}->${to}`,
      ),
    );
    expect(allowed.sort()).toEqual(
      [
        "NEW->PICKING",
        "PICKING->READY",
        "READY->COLLECTED",
        "NEW->CANCELLED",
        "PICKING->CANCELLED",
      ].sort(),
    );
  });

  it("treats COLLECTED and CANCELLED as terminal", () => {
    expect(ALLOWED_TRANSITIONS.COLLECTED).toHaveLength(0);
    expect(ALLOWED_TRANSITIONS.CANCELLED).toHaveLength(0);
  });
});

describe("canMarkReady", () => {
  it("passes for a PICKING order with every item fully picked", () => {
    expect(canMarkReady(order())).toEqual({ ok: true });
  });

  it.each(["NEW", "READY", "COLLECTED", "CANCELLED"] as const)(
    "rejects status %s",
    (status) => {
      expect(canMarkReady(order({ status }))).toMatchObject({
        ok: false,
        code: "INVALID_STATUS",
      });
    },
  );

  it("rejects an order with no items", () => {
    expect(canMarkReady(order({ items: [] }))).toMatchObject({
      ok: false,
      code: "NO_ITEMS",
    });
  });

  it.each([0, -1, 1.5])(
    "rejects a required quantity of %p",
    (requiredQuantity) => {
      const result = canMarkReady(
        order({
          items: [item({ requiredQuantity, pickedQuantity: requiredQuantity })],
        }),
      );
      expect(result).toMatchObject({ ok: false, code: "INVALID_QUANTITY" });
    },
  );

  it("rejects under-picked items and reports how many remain", () => {
    const result = canMarkReady(
      order({
        items: [
          item({ id: "a", pickedQuantity: 1 }),
          item({ id: "b", pickedQuantity: 0 }),
          item({ id: "c" }),
        ],
      }),
    );
    expect(result).toEqual({
      ok: false,
      code: "ITEMS_NOT_VERIFIED",
      message: "2 items still to verify.",
    });
  });

  it("rejects over-picked items because picked must equal required", () => {
    const result = canMarkReady(
      order({ items: [item({ requiredQuantity: 1, pickedQuantity: 2 })] }),
    );
    expect(result).toMatchObject({ ok: false, code: "ITEMS_NOT_VERIFIED" });
  });
});

describe("markOrderReady", () => {
  it("returns a new READY order with an incremented version", () => {
    const input = order();
    const result = markOrderReady(input);

    expect(result.status).toBe("READY");
    expect(result.version).toBe(input.version + 1);
    expect(result).not.toBe(input);
  });

  it("does not mutate the input and returns a frozen object", () => {
    const input = order();
    const snapshot = JSON.parse(JSON.stringify(input));
    const result = markOrderReady(input);

    expect(input).toEqual(snapshot);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.items)).toBe(true);
    expect(Object.isFrozen(result.items[0])).toBe(true);
  });

  it("throws an OrderTransitionError for an incomplete order", () => {
    const incomplete = order({ items: [item({ pickedQuantity: 0 })] });
    expect(() => markOrderReady(incomplete)).toThrow(OrderTransitionError);
    expect(() => markOrderReady(incomplete)).toThrow("1 item still to verify.");
  });

  it("throws TRANSITION_NOT_ALLOWED for a NEW order", () => {
    try {
      markOrderReady(order({ status: "NEW" }));
      throw new Error("expected markOrderReady to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(OrderTransitionError);
      expect((error as OrderTransitionError).code).toBe(
        "TRANSITION_NOT_ALLOWED",
      );
    }
  });
});

describe("startPicking and transitionOrder", () => {
  it("moves NEW to PICKING and bumps the version", () => {
    const result = startPicking(order({ status: "NEW", version: 1 }));
    expect(result).toMatchObject({ status: "PICKING", version: 2 });
  });

  it("rejects starting to pick an order that is already PICKING", () => {
    expect(() => startPicking(order())).toThrow(
      "Cannot move an order from PICKING to PICKING.",
    );
  });

  it("rejects any transition out of a terminal state", () => {
    expect(() =>
      transitionOrder(order({ status: "COLLECTED" }), "READY"),
    ).toThrow(OrderTransitionError);
    expect(() =>
      transitionOrder(order({ status: "CANCELLED" }), "PICKING"),
    ).toThrow(OrderTransitionError);
  });

  it("cannot bypass verification by calling transitionOrder directly", () => {
    expect(() =>
      transitionOrder(order({ items: [item({ pickedQuantity: 0 })] }), "READY"),
    ).toThrow(OrderTransitionError);
  });
});

describe("getPickingProgress", () => {
  it("counts fully picked line items", () => {
    const progress = getPickingProgress(
      order({
        items: [
          item({ id: "a" }),
          item({ id: "b", pickedQuantity: 1 }),
          item({ id: "c", pickedQuantity: 0 }),
        ],
      }),
    );
    expect(progress).toEqual({
      verifiedItems: 1,
      totalItems: 3,
      ratio: 1 / 3,
      percent: 33,
    });
  });

  it("returns zero instead of NaN for an order with no items", () => {
    expect(getPickingProgress(order({ items: [] }))).toEqual({
      verifiedItems: 0,
      totalItems: 0,
      ratio: 0,
      percent: 0,
    });
  });

  it("does not count zero-quantity items as verified", () => {
    const progress = getPickingProgress(
      order({ items: [item({ requiredQuantity: 0, pickedQuantity: 0 })] }),
    );
    expect(progress.verifiedItems).toBe(0);
  });
});
