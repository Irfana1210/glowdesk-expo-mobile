/**
 * Click & Collect timing rules from the design handoff. Pure functions; `now` is passed in.
 * An order is due a fixed pickup window after it is placed. Overdue orders are picked first.
 */
import { type Order } from "@/types/order";

/** Customers are promised their order within two hours of placing it. */
export const PICKUP_WINDOW_MINUTES = 120;

const MINUTE = 60_000;

export function isActive(order: Order): boolean {
  return order.status === "NEW" || order.status === "PICKING";
}

export function dueAt(order: Order): Date {
  return new Date(Date.parse(order.createdAt) + PICKUP_WINDOW_MINUTES * MINUTE);
}

/** Only orders still being prepared can be overdue. */
export function isOverdue(order: Order, now: Date): boolean {
  return isActive(order) && now.getTime() > dueAt(order).getTime();
}

/** Whole minutes past due, or 0 when not overdue. */
export function minutesOverdue(order: Order, now: Date): number {
  return isOverdue(order, now)
    ? Math.floor((now.getTime() - dueAt(order).getTime()) / MINUTE)
    : 0;
}

/** Minutes since the order became ready, or null if it has no ready time. */
export function minutesWaiting(order: Order, now: Date): number | null {
  if (!order.readyAt) {
    return null;
  }
  return Math.max(
    0,
    Math.floor((now.getTime() - Date.parse(order.readyAt)) / MINUTE),
  );
}

const STATUS_RANK = {
  NEW: 1,
  PICKING: 1,
  READY: 2,
  COLLECTED: 3,
  CANCELLED: 4,
} as const;

/**
 * Work order for the Orders list:
 * 1. Overdue orders, most overdue first.
 * 2. Other New and Picking orders, soonest due first.
 * 3. Ready orders, most recently ready first.
 * 4. Collected, then Cancelled, newest first.
 */
export function sortForPicking(orders: Array<Order>, now: Date): Array<Order> {
  const rank = (o: Order) => (isOverdue(o, now) ? 0 : STATUS_RANK[o.status]);
  return [...orders].sort((a, b) => {
    const byRank = rank(a) - rank(b);
    if (byRank !== 0) {
      return byRank;
    }
    if (rank(a) <= 1) {
      return dueAt(a).getTime() - dueAt(b).getTime();
    }
    const stamp = (o: Order) => Date.parse(o.readyAt ?? o.createdAt);
    return stamp(b) - stamp(a);
  });
}

export function overdueOrders(orders: Array<Order>, now: Date): Array<Order> {
  return orders
    .filter((o) => isOverdue(o, now))
    .sort((a, b) => minutesOverdue(b, now) - minutesOverdue(a, now));
}

/** New or Picking orders nobody has picked up yet. */
export function unassignedActiveCount(orders: Array<Order>): number {
  return orders.filter((o) => isActive(o) && !o.assigneeId).length;
}
