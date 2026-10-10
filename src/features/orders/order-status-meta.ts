import { LOCALE } from "@/constants/locale";

import { type StatusBadgeProps } from "@/components/ui/status-badge";

import { type OrderStatus } from "@/types/order";

export const ORDER_STATUS_META: Record<OrderStatus, StatusBadgeProps> = {
  NEW: { label: LOCALE.orders.status.new, icon: "add", tone: "new" },
  PICKING: {
    label: LOCALE.orders.status.picking,
    icon: "basket-outline",
    tone: "picking",
  },
  READY: {
    label: LOCALE.orders.status.ready,
    icon: "checkmark",
    tone: "ready",
  },
  COLLECTED: {
    label: LOCALE.orders.status.collected,
    icon: "bag-check-outline",
    tone: "neutral",
  },
  CANCELLED: {
    label: LOCALE.orders.status.cancelled,
    icon: "close",
    tone: "overdue",
  },
};
