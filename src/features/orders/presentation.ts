/**
 * Turns an order into the text the Orders list shows. Pure, so it is tested without rendering.
 */
import { LOCALE } from "@/constants/locale";

import { FormatUtils } from "@/utils/format-utils";

import { type Order } from "@/types/order";

import { ScheduleUtils } from "./domain/schedule";
import { ORDER_STATUS_META } from "./order-status-meta";

const L = LOCALE.orders.card;

export type OrderCardModel = {
  accessibilityLabel: string;
  assigneeLabel: string;
  initials: string;
  orderNumber: string;
  overdue: boolean;
  summary: string;
  timingLabel: string;
};

export namespace OrderPresentationUtils {
  function isSameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  /** "1:47 pm" today, otherwise "yesterday" or the date. */
  export function placedLabel(order: Order, now: Date): string {
    const placed = new Date(order.createdAt);
    if (isSameDay(placed, now)) {
      return FormatUtils.formatClockTime(placed);
    }
    const yesterday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 1,
    );
    return isSameDay(placed, yesterday)
      ? L.yesterday
      : placed.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
  }

  export function orderNumber(order: Order): string {
    return order.id.replace(/^ORD-/, "");
  }

  export function timingLabel(order: Order, now: Date): string {
    if (ScheduleUtils.isOverdue(order, now)) {
      return L.overdue(
        FormatUtils.formatDuration(ScheduleUtils.minutesOverdue(order, now)),
      );
    }
    switch (order.status) {
      case "NEW":
      case "PICKING":
        return L.due(FormatUtils.formatClockTime(ScheduleUtils.dueAt(order)));
      case "READY": {
        const waiting = ScheduleUtils.minutesWaiting(order, now);
        return waiting === null
          ? L.ready
          : L.waiting(FormatUtils.formatWaiting(waiting));
      }
      case "COLLECTED":
        return L.collected;
      case "CANCELLED":
        return L.cancelled;
    }
  }

  export function assigneeLabel(
    order: Order,
    assigneeName: string | undefined,
  ): string {
    if (order.status === "CANCELLED") {
      return L.notPicked;
    }
    if (!assigneeName) {
      return L.unassigned;
    }
    return order.status === "READY" || order.status === "COLLECTED"
      ? L.packedBy(assigneeName)
      : assigneeName;
  }

  export function orderCardModel(
    order: Order,
    assigneeName: string | undefined,
    now: Date,
  ): OrderCardModel {
    const number = orderNumber(order);
    const status = ORDER_STATUS_META[order.status].label;
    const timing = timingLabel(order, now);
    const assignee = assigneeLabel(order, assigneeName);
    const items = L.itemCount(order.items.length);
    return {
      orderNumber: number,
      initials: order.customerInitials,
      summary: L.summary(items, placedLabel(order, now)),
      assigneeLabel: assignee,
      timingLabel: timing,
      overdue: ScheduleUtils.isOverdue(order, now),
      accessibilityLabel: L.accessibilityLabel(
        number,
        status,
        timing,
        assignee,
        items,
      ),
    };
  }

  /** "J.L." -> "J L", so screen readers read the letters rather than a word. */
  export function spellInitials(initials: string): string {
    return initials.replace(/\./g, "").split("").join(" ");
  }
}
