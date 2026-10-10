import { type FC } from "react";

import { StatusBadge } from "@/components/ui/StatusBadge";

import { type OrderStatus } from "@/types/order";

import { ORDER_STATUS_META } from "../orderStatusMeta";

export const OrderStatusBadge: FC<{ status: OrderStatus }> = ({ status }) => {
  return <StatusBadge {...ORDER_STATUS_META[status]} />;
};
