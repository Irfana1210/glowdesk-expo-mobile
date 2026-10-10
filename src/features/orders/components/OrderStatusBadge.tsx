import { StatusBadge } from '@/components/ui/StatusBadge';
import type { OrderStatus } from '@/types/order';

import { ORDER_STATUS_META } from '../orderStatusMeta';

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <StatusBadge {...ORDER_STATUS_META[status]} />;
}
