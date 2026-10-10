/**
 * Who is picking an order. Pure functions, like the state machine: every change returns a new
 * frozen order with an incremented version, so a future backend can reject stale updates.
 */
import { LOCALE } from "@/constants/locale";

import { type Order, type OrderItem } from "@/types/order";

import { OrderStateMachine } from "./order-state-machine";
import { ScheduleUtils } from "./schedule";

export namespace AssignmentUtils {
  export class AssignmentError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "AssignmentError";
    }
  }

  /** Assigns an order to a team member, or unassigns it when `employeeId` is undefined. */
  export function assignOrder(
    order: Order,
    employeeId: string | undefined,
  ): Order {
    if (!ScheduleUtils.isActive(order)) {
      throw new AssignmentError(LOCALE.orders.assignment.notReassignable);
    }
    const { assigneeId: _previous, ...rest } = order;
    return Object.freeze({
      ...rest,
      ...(employeeId ? { assigneeId: employeeId } : {}),
      version: order.version + 1,
      items: Object.freeze(
        order.items.map((item) => Object.freeze({ ...item })),
      ) as Array<OrderItem>,
    });
  }

  /** Cancels a New or Picking order through the existing state machine rules. */
  export function cancelOrder(order: Order): Order {
    return OrderStateMachine.transitionOrder(order, "CANCELLED");
  }
}
