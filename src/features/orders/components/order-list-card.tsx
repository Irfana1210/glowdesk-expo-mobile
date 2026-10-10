import { memo } from "react";

import { OrderCard } from "@/components/ui/order-card";

import { type Order } from "@/types/order";

import { ORDER_STATUS_META } from "../order-status-meta";
import { OrderPresentationUtils } from "../presentation";

export type OrderListCardProps = {
  assigneeName: string | undefined;
  now: Date;
  onPress: (orderId: string) => void;
  order: Order;
};

/** Maps a domain order onto the shared OrderCard. */
function OrderListCardComponent({
  order,
  assigneeName,
  now,
  onPress,
}: OrderListCardProps) {
  const model = OrderPresentationUtils.orderCardModel(order, assigneeName, now);
  return (
    <OrderCard
      testID={`order-card-${order.id}`}
      {...model}
      status={ORDER_STATUS_META[order.status]}
      onPress={() => onPress(order.id)}
    />
  );
}

export const OrderListCard = memo(OrderListCardComponent);
