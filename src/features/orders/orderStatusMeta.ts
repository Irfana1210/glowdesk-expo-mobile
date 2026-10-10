import type { StatusBadgeProps } from '@/components/ui/StatusBadge';
import type { OrderStatus } from '@/types/order';

export const ORDER_STATUS_META: Record<OrderStatus, StatusBadgeProps> = {
  NEW: { label: 'New', icon: 'add', tone: 'new' },
  PICKING: { label: 'Picking', icon: 'basket-outline', tone: 'picking' },
  READY: { label: 'Ready', icon: 'checkmark', tone: 'ready' },
  COLLECTED: { label: 'Collected', icon: 'bag-check-outline', tone: 'neutral' },
  CANCELLED: { label: 'Cancelled', icon: 'close', tone: 'overdue' },
};

export function spellInitials(initials: string): string {
  return initials.replace(/\./g, '').split('').join(' ');
}
