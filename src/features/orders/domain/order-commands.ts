/**
 * Every change to an order, expressed as a command. The app applies a command to show the result
 * straight away, and the server applies the same command again with the same rules, so the two
 * can never disagree. Pure functions only.
 */
import { LOCALE } from "@/constants/locale";

import { type Order } from "@/types/order";

import { AssignmentUtils } from "./assignment";
import { OrderStateMachine } from "./order-state-machine";
import { PickingUtils } from "./picking";

export type OrderCommand =
  | { employeeId?: string; type: "ASSIGN" }
  | { type: "CANCEL" }
  | { type: "MARK_READY" }
  | { barcode: string; type: "SCAN_ITEM" }
  | { type: "START_PICKING" };

type CommandResult =
  | { ok: true; order: Order }
  | { message: string; ok: false };

export namespace OrderCommandUtils {
  /** Applies a command. Returns the rule's message when the command is not allowed. */
  export function apply(
    order: Order,
    command: OrderCommand,
    now: Date,
  ): CommandResult {
    try {
      return { ok: true, order: applyOrThrow(order, command, now) };
    } catch (error) {
      return {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : LOCALE.orders.store.genericError,
      };
    }
  }

  function applyOrThrow(order: Order, command: OrderCommand, now: Date) {
    switch (command.type) {
      case "START_PICKING":
        return OrderStateMachine.startPicking(order);
      case "SCAN_ITEM": {
        const result = PickingUtils.recordPick(order, command.barcode);
        if (!result.ok) {
          throw new Error(result.message);
        }
        return result.order;
      }
      case "ASSIGN":
        return AssignmentUtils.assignOrder(order, command.employeeId);
      case "MARK_READY":
        return OrderStateMachine.markOrderReady(order, now);
      case "CANCEL":
        return AssignmentUtils.cancelOrder(order);
    }
  }

  const PRIORITY_RANK = { HIGH: 0, STANDARD: 1 } as const;

  /** High priority first, then newest first. */
  export function sortOrders(orders: Array<Order>): Array<Order> {
    return [...orders].sort(
      (a, b) =>
        PRIORITY_RANK[a.priority ?? "STANDARD"] -
          PRIORITY_RANK[b.priority ?? "STANDARD"] ||
        b.createdAt.localeCompare(a.createdAt),
    );
  }
}
