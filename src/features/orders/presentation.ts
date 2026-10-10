/**
 * Turns an order into the text the Orders list shows. Pure, so it is tested without rendering.
 */
import { formatClockTime, formatDuration, formatWaiting, pluralise } from '@/lib/format';
import type { Order } from '@/types/order';

import { dueAt, isOverdue, minutesOverdue, minutesWaiting } from './domain/schedule';
import { ORDER_STATUS_META } from './orderStatusMeta';

export interface OrderCardModel {
  orderNumber: string;
  initials: string;
  summary: string;
  assigneeLabel: string;
  timingLabel: string;
  overdue: boolean;
  accessibilityLabel: string;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** "1:47 pm" today, otherwise "yesterday" or the date. */
export function placedLabel(order: Order, now: Date): string {
  const placed = new Date(order.createdAt);
  if (isSameDay(placed, now)) return formatClockTime(placed);
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  return isSameDay(placed, yesterday) ? 'yesterday' : placed.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

export function orderNumber(order: Order): string {
  return order.id.replace(/^ORD-/, '');
}

export function timingLabel(order: Order, now: Date): string {
  if (isOverdue(order, now)) return `Overdue ${formatDuration(minutesOverdue(order, now))}`;
  switch (order.status) {
    case 'NEW':
    case 'PICKING':
      return `Due ${formatClockTime(dueAt(order))}`;
    case 'READY': {
      const waiting = minutesWaiting(order, now);
      return waiting === null ? 'Ready' : `Waiting ${formatWaiting(waiting)}`;
    }
    case 'COLLECTED':
      return 'Collected';
    case 'CANCELLED':
      return 'Cancelled';
  }
}

export function assigneeLabel(order: Order, assigneeName: string | undefined): string {
  if (order.status === 'CANCELLED') return 'Not picked';
  if (!assigneeName) return 'Unassigned';
  return order.status === 'READY' || order.status === 'COLLECTED' ? `Packed by ${assigneeName}` : assigneeName;
}

export function orderCardModel(order: Order, assigneeName: string | undefined, now: Date): OrderCardModel {
  const number = orderNumber(order);
  const status = ORDER_STATUS_META[order.status].label;
  const timing = timingLabel(order, now);
  const assignee = assigneeLabel(order, assigneeName);
  const items = pluralise(order.items.length, 'item');
  return {
    orderNumber: number,
    initials: order.customerInitials,
    summary: `${items} · placed ${placedLabel(order, now)}`,
    assigneeLabel: assignee,
    timingLabel: timing,
    overdue: isOverdue(order, now),
    accessibilityLabel: `Order ${number}, ${status}, ${timing}, ${assignee}, ${items}`,
  };
}
