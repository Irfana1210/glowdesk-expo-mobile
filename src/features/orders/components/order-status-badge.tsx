import { type FC } from "react";

import { StatusBadge } from "@/components/ui/status-badge";

import { type OrderStatus } from "@/types/order";

import { ORDER_STATUS_META } from "../order-status-meta";

export const OrderStatusBadge: FC<{ status: OrderStatus }> = ({ status }) => {
  return <StatusBadge {...ORDER_STATUS_META[status]} />;
};
