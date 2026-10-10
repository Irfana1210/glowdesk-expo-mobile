import { BarcodeUtils } from "@/utils/barcode-utils";

import { OrderStateMachine } from "@/features/orders/domain/order-state-machine";
import { PickingUtils } from "@/features/orders/domain/picking";

import { type Order, type OrderItem } from "@/types/order";

const SERUM = "9301234000011";
const CREAM = "9301234000028";

const item = (overrides: Partial<OrderItem> = {}): OrderItem => ({
  id: "line-1",
  productId: "prod-1",
  sku: "SKU-1",
  barcode: SERUM,
  name: "Glow Serum",
  requiredQuantity: 2,
  pickedQuantity: 0,
  ...overrides,
});

const order = (overrides: Partial<Order> = {}): Order => ({
  id: "ORD-1",
  storeId: "store-1",
  customerInitials: "AB",
  status: "PICKING",
  version: 1,
  createdAt: "2026-10-10T09:00:00.000Z",
  items: [
    item(),
    item({
      id: "line-2",
      productId: "prod-2",
      barcode: CREAM,
      name: "Cloud Cream",
      requiredQuantity: 1,
    }),
  ],
  ...overrides,
});

describe("normaliseBarcode", () => {
  it.each([
    [" 9301234000011 ", "9301234000011"],
    ["9301 2340 0001 1", "9301234000011"],
    ["12345678", "12345678"],
  ])("accepts %p", (raw, expected) => {
    expect(BarcodeUtils.normaliseBarcode(raw)).toBe(expected);
  });

  it.each(["", "abc", "1234567", "123456789012345", "93012340000-1"])(
    "rejects %p",
    (raw) => {
      expect(BarcodeUtils.normaliseBarcode(raw)).toBeNull();
    },
  );
});

describe("barcodesMatch", () => {
  it("matches identical codes", () => {
    expect(BarcodeUtils.barcodesMatch(SERUM, SERUM)).toBe(true);
  });

  it("treats UPC-A and its zero-padded EAN-13 form as the same product", () => {
    expect(BarcodeUtils.barcodesMatch("012345678905", "0012345678905")).toBe(
      true,
    );
  });

  it("does not match different products", () => {
    expect(BarcodeUtils.barcodesMatch(SERUM, CREAM)).toBe(false);
  });
});

describe("recordPick", () => {
  it("increments the picked quantity of the matching item", () => {
    const result = PickingUtils.recordPick(order(), SERUM);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.item.pickedQuantity).toBe(1);
    expect(result.order.items[0]?.pickedQuantity).toBe(1);
    expect(result.order.items[1]?.pickedQuantity).toBe(0);
  });

  it("returns a new frozen order with a bumped version and leaves the input untouched", () => {
    const input = order();
    const result = PickingUtils.recordPick(input, SERUM);

    if (!result.ok) {
      throw new Error("expected success");
    }
    expect(result.order.version).toBe(2);
    expect(input.items[0]?.pickedQuantity).toBe(0);
    expect(Object.isFrozen(result.order)).toBe(true);
    expect(Object.isFrozen(result.order.items[0])).toBe(true);
  });

  it("rejects a barcode that is not in the order", () => {
    expect(PickingUtils.recordPick(order(), "9999999999994")).toMatchObject({
      ok: false,
      code: "NOT_IN_ORDER",
    });
  });

  it("prevents over-picking once the required quantity is reached", () => {
    const full = order({ items: [item({ pickedQuantity: 2 })] });
    const result = PickingUtils.recordPick(full, SERUM);

    expect(result).toMatchObject({ ok: false, code: "ALREADY_PICKED" });
    expect(full.items[0]?.pickedQuantity).toBe(2);
  });

  it("rejects scans unless the order is PICKING", () => {
    for (const status of ["NEW", "READY", "COLLECTED", "CANCELLED"] as const) {
      expect(PickingUtils.recordPick(order({ status }), SERUM)).toMatchObject({
        ok: false,
        code: "ORDER_NOT_PICKING",
      });
    }
  });

  it("rejects malformed input before looking anything up", () => {
    expect(
      PickingUtils.recordPick(order({ status: "NEW" }), "hello"),
    ).toMatchObject({
      ok: false,
      code: "INVALID_BARCODE",
    });
  });

  it("makes the order ready-able only after every unit is scanned", () => {
    let current = order();
    for (const code of [SERUM, CREAM, SERUM]) {
      expect(OrderStateMachine.canMarkReady(current).ok).toBe(false);
      const result = PickingUtils.recordPick(current, code);
      if (!result.ok) {
        throw new Error(result.message);
      }
      current = result.order;
    }
    expect(OrderStateMachine.canMarkReady(current)).toEqual({ ok: true });
    expect(current.version).toBe(4);
  });
});

describe("remainingQuantity", () => {
  it("never goes negative", () => {
    expect(PickingUtils.remainingQuantity(item({ pickedQuantity: 5 }))).toBe(0);
    expect(PickingUtils.remainingQuantity(item({ pickedQuantity: 1 }))).toBe(1);
  });
});
