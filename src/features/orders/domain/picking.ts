/**
 * Picking rules: barcode matching, quantity validation and over-pick prevention.
 * Pure functions only, like the state machine. Every successful pick returns a
 * new frozen order with an incremented version.
 */
import { barcodesMatch, normaliseBarcode } from "@/utils/barcode-utils";

import { type Order, type OrderItem } from "@/types/order";

export type PickFailureCode =
  | "INVALID_BARCODE"
  | "ORDER_NOT_PICKING"
  | "NOT_IN_ORDER"
  | "ALREADY_PICKED";

export type PickResult =
  | { item: OrderItem; ok: true; order: Order }
  | { code: PickFailureCode; item?: OrderItem; message: string; ok: false };

export function findItemByBarcode(
  order: Order,
  barcode: string,
): OrderItem | undefined {
  return order.items.find((item) => barcodesMatch(item.barcode, barcode));
}

export function remainingQuantity(item: OrderItem): number {
  return Math.max(0, item.requiredQuantity - item.pickedQuantity);
}

/** Records one unit for the scanned barcode, rejecting wrong products and over-picks. */
export function recordPick(order: Order, rawBarcode: string): PickResult {
  const barcode = normaliseBarcode(rawBarcode);
  if (!barcode) {
    return {
      ok: false,
      code: "INVALID_BARCODE",
      message: "Enter a valid barcode of 8 to 14 digits.",
    };
  }
  if (order.status !== "PICKING") {
    return {
      ok: false,
      code: "ORDER_NOT_PICKING",
      message: "Start picking this order before scanning products.",
    };
  }

  const item = findItemByBarcode(order, barcode);
  if (!item) {
    return {
      ok: false,
      code: "NOT_IN_ORDER",
      message: `Wrong product. Barcode ${barcode} is not part of this order.`,
    };
  }
  if (remainingQuantity(item) === 0) {
    return {
      ok: false,
      code: "ALREADY_PICKED",
      message: `${item.name} is already fully picked (${item.pickedQuantity}/${item.requiredQuantity}). Put the extra unit back.`,
      item,
    };
  }

  const updatedItem: OrderItem = Object.freeze({
    ...item,
    pickedQuantity: item.pickedQuantity + 1,
  });
  const updatedOrder: Order = Object.freeze({
    ...order,
    version: order.version + 1,
    items: Object.freeze(
      order.items.map((i) =>
        i.id === item.id ? updatedItem : Object.freeze({ ...i }),
      ),
    ) as Array<OrderItem>,
  });
  return { ok: true, order: updatedOrder, item: updatedItem };
}
