import { useSafeQuery } from "@/hooks/query/use-safe-query";

import {
  selectStoreId,
  useSessionStore,
} from "@/features/auth/store/session.store";
import { OrderCommandUtils } from "@/features/orders/domain/order-commands";

import { StaleTimeMs } from "@/types/enums";

import { OrdersService } from "../services/orders.service";
import { OrderMutations } from "./order-mutations";

/** The store's Click & Collect orders, highest priority first, then newest. */
export function useOrders() {
  const storeId = useSessionStore(selectStoreId);
  return useSafeQuery({
    queryKey: OrderMutations.ordersQueryKey(storeId),
    queryFn: () => OrdersService.fetchOrders(storeId),
    select: OrderCommandUtils.sortOrders,
    staleTime: StaleTimeMs.Orders,
  });
}

/** One order from the same cached list, so every screen shows the same copy. */
export function useOrder(orderId: string | undefined) {
  const query = useOrders();
  return {
    ...query,
    order: orderId ? query.data?.find((o) => o.id === orderId) : undefined,
  };
}
