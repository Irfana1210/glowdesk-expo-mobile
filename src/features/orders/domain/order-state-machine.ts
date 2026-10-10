/**
 * Order state machine and validation rules (brief §7 and §8).
 *
 * Pure functions only: no React, no store, no I/O. Every transition returns a
 * new frozen order with an incremented version and never mutates its input.
 * In production these rules must also be enforced atomically on the backend.
 */
import { type Order, type OrderItem, type OrderStatus } from "@/types/order";

export type ReadinessFailureCode =
  | "INVALID_STATUS"
  | "NO_ITEMS"
  | "INVALID_QUANTITY"
  | "ITEMS_NOT_VERIFIED";

export type ReadinessResult =
  | { ok: true }
  | { code: ReadinessFailureCode; message: string; ok: false };

export type PickingProgress = {
  /** Whole-number percentage, 0 to 100. */
  percent: number;
  /** 0 to 1. Zero when the order has no items. */
  ratio: number;
  totalItems: number;
  verifiedItems: number;
};

export type UnitProgress = {
  /** Whole-number percentage, 0 to 100. */
  percent: number;
  pickedUnits: number;
  /** 0 to 1. Zero when the order has no units. */
  ratio: number;
  remainingUnits: number;
  totalUnits: number;
};

export namespace OrderStateMachine {
  export const ALLOWED_TRANSITIONS: Readonly<
    Record<OrderStatus, ReadonlyArray<OrderStatus>>
  > = {
    NEW: ["PICKING", "CANCELLED"],
    PICKING: ["READY", "CANCELLED"],
    READY: ["COLLECTED"],
    COLLECTED: [],
    CANCELLED: [],
  };

  export class OrderTransitionError extends Error {
    readonly from: OrderStatus;
    readonly to: OrderStatus;
    readonly code: ReadinessFailureCode | "TRANSITION_NOT_ALLOWED";

    constructor(
      from: OrderStatus,
      to: OrderStatus,
      code: OrderTransitionError["code"],
      message: string,
    ) {
      super(message);
      this.name = "OrderTransitionError";
      this.from = from;
      this.to = to;
      this.code = code;
    }
  }

  export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
    return ALLOWED_TRANSITIONS[from].includes(to);
  }

  export function isItemVerified(item: OrderItem): boolean {
    return (
      item.requiredQuantity > 0 && item.pickedQuantity === item.requiredQuantity
    );
  }

  /** Brief §8: status PICKING, at least one item, positive quantities, all picked. */
  export function canMarkReady(order: Order): ReadinessResult {
    if (order.status !== "PICKING") {
      return {
        ok: false,
        code: "INVALID_STATUS",
        message: `Only orders in Picking can be marked ready. This order is ${order.status}.`,
      };
    }
    if (order.items.length === 0) {
      return {
        ok: false,
        code: "NO_ITEMS",
        message: "This order has no items to verify.",
      };
    }
    if (
      order.items.some(
        (item) =>
          !Number.isInteger(item.requiredQuantity) ||
          item.requiredQuantity <= 0,
      )
    ) {
      return {
        ok: false,
        code: "INVALID_QUANTITY",
        message: "Every item must have a required quantity greater than zero.",
      };
    }
    const remaining = order.items.filter(
      (item) => !isItemVerified(item),
    ).length;
    if (remaining > 0) {
      return {
        ok: false,
        code: "ITEMS_NOT_VERIFIED",
        message: `${remaining} ${remaining === 1 ? "item" : "items"} still to verify.`,
      };
    }
    return { ok: true };
  }

  function freezeOrder(order: Order): Order {
    return Object.freeze({
      ...order,
      items: Object.freeze(
        order.items.map((item) => Object.freeze({ ...item })),
      ) as Array<OrderItem>,
    });
  }

  /**
   * Generic guarded transition. Moving to READY additionally requires
   * `canMarkReady`, so no caller can bypass the verification rule.
   */
  export function transitionOrder(
    order: Order,
    to: OrderStatus,
    now: Date = new Date(),
  ): Order {
    if (!canTransition(order.status, to)) {
      throw new OrderTransitionError(
        order.status,
        to,
        "TRANSITION_NOT_ALLOWED",
        `Cannot move an order from ${order.status} to ${to}.`,
      );
    }
    if (to === "READY") {
      const readiness = canMarkReady(order);
      if (!readiness.ok) {
        throw new OrderTransitionError(
          order.status,
          to,
          readiness.code,
          readiness.message,
        );
      }
    }
    const readyAt = to === "READY" ? now.toISOString() : order.readyAt;
    return freezeOrder({
      ...order,
      status: to,
      version: order.version + 1,
      ...(readyAt ? { readyAt } : {}),
    });
  }

  export function startPicking(order: Order): Order {
    return transitionOrder(order, "PICKING");
  }

  export function markOrderReady(order: Order, now: Date = new Date()): Order {
    return transitionOrder(order, "READY", now);
  }

  export function getPickingProgress(order: Order): PickingProgress {
    const totalItems = order.items.length;
    const verifiedItems = order.items.filter(isItemVerified).length;
    const ratio = totalItems === 0 ? 0 : verifiedItems / totalItems;
    return {
      verifiedItems,
      totalItems,
      ratio,
      percent: Math.round(ratio * 100),
    };
  }

  export function getTotalUnits(order: Order): number {
    return order.items.reduce((sum, item) => sum + item.requiredQuantity, 0);
  }

  /** Progress counted in units (2 of 6), as the order details design shows. Over-picks never count. */
  export function getUnitProgress(order: Order): UnitProgress {
    const totalUnits = getTotalUnits(order);
    const pickedUnits = order.items.reduce(
      (sum, item) =>
        sum + Math.max(0, Math.min(item.pickedQuantity, item.requiredQuantity)),
      0,
    );
    const ratio = totalUnits <= 0 ? 0 : pickedUnits / totalUnits;
    return {
      pickedUnits,
      totalUnits,
      remainingUnits: Math.max(0, totalUnits - pickedUnits),
      ratio,
      percent: Math.round(ratio * 100),
    };
  }
}
