import { memo } from "react";

import { LOCALE } from "@/constants/locale";

import { OrderCard } from "@/components/ui/order-card";

import { type Order } from "@/types/order";

import { ORDER_STATUS_META } from "../order-status-meta";
import { OrderPresentationUtils } from "../presentation";

type OrderListCardProps = {
  assigneeName: string | undefined;
  now: Date;
  onPress: (orderId: string) => void;
  order: Order;
  /** True while the order has changes waiting to reach the server. */
  pendingSync?: boolean;
};

/** Maps a domain order onto the shared OrderCard. */
function OrderListCardComponent({
  order,
  assigneeName,
  now,
  pendingSync = false,
  onPress,
}: OrderListCardProps) {
  const model = OrderPresentationUtils.orderCardModel(order, assigneeName, now);
  return (
    <OrderCard
      testID={`ORDER_LIST.CARD.${order.id}`}
      {...model}
      status={ORDER_STATUS_META[order.status]}
      syncLabel={pendingSync ? LOCALE.sync.waitingBadge : undefined}
      onPress={() => onPress(order.id)}
    />
  );
}

export const OrderListCard = memo(OrderListCardComponent);
