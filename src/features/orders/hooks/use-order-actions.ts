import { onlineManager, useQueryClient } from "@tanstack/react-query";

import { LOCALE } from "@/constants/locale";

import { errorMessage } from "@/utils/handle-api-error";

import { useSafeMutation } from "@/hooks/query/use-safe-mutation";

import {
  selectStoreId,
  useSessionStore,
} from "@/features/auth/store/session.store";
import {
  type OrderCommand,
  OrderCommandUtils,
} from "@/features/orders/domain/order-commands";
import {
  PickingUtils,
  type PickResult,
} from "@/features/orders/domain/picking";

import { type Order } from "@/types/order";

import { OrderMutations, type OrderUpdateVariables } from "./order-mutations";

type ActionResult = { ok: true } | { message: string; ok: false };

/**
 * Order changes for screens. Each one is checked against the shared rules first, so a mistake
 * is explained on screen without a round trip.
 *
 * Start picking, scan and assign update the screen straight away and queue the change, so they
 * work offline. Mark ready and cancel wait for the server and need a connection.
 */
export function useOrderActions() {
  const client = useQueryClient();
  const storeId = useSessionStore(selectStoreId);
  const queued = useSafeMutation<Order, Error, OrderUpdateVariables>({
    mutationKey: OrderMutations.QUEUED_KEY,
  });
  const confirmed = useSafeMutation<Order, Error, OrderUpdateVariables>({
    mutationKey: OrderMutations.CONFIRMED_KEY,
  });

  // Always read the cache, not the order a screen rendered: two quick scans must chain versions.
  const current = (orderId: string) =>
    client
      .getQueryData<Array<Order>>(OrderMutations.ordersQueryKey(storeId))
      ?.find((o) => o.id === orderId);

  const showAndQueue = (before: Order, after: Order, command: OrderCommand) => {
    void client.cancelQueries({
      queryKey: OrderMutations.ordersQueryKey(storeId),
    });
    OrderMutations.writeOrder(client, storeId, after);
    queued.mutate({
      command,
      expectedVersion: before.version,
      orderId: before.id,
      storeId,
    });
  };

  const queue = (orderId: string, command: OrderCommand): ActionResult => {
    const order = current(orderId);
    if (!order) {
      return { ok: false, message: LOCALE.orders.store.orderNotFound };
    }
    const result = OrderCommandUtils.apply(order, command, new Date());
    if (!result.ok) {
      return result;
    }
    showAndQueue(order, result.order, command);
    return { ok: true };
  };

  const confirm = async (
    orderId: string,
    command: OrderCommand,
  ): Promise<ActionResult> => {
    const order = current(orderId);
    if (!order) {
      return { ok: false, message: LOCALE.orders.store.orderNotFound };
    }
    const check = OrderCommandUtils.apply(order, command, new Date());
    if (!check.ok) {
      return check;
    }
    if (!onlineManager.isOnline()) {
      return { ok: false, message: LOCALE.sync.needsConnection };
    }
    try {
      await confirmed.mutateAsync({
        command,
        expectedVersion: order.version,
        orderId,
        storeId,
      });
      return { ok: true };
    } catch (error) {
      return { ok: false, message: errorMessage(error) };
    }
  };

  return {
    assignOrder: (orderId: string, employeeId: string | undefined) =>
      queue(orderId, { employeeId, type: "ASSIGN" }),
    cancelOrder: (orderId: string) => confirm(orderId, { type: "CANCEL" }),
    /** True while mark ready or cancel waits for the server. */
    isConfirming: confirmed.isPending,
    markReady: (orderId: string) => confirm(orderId, { type: "MARK_READY" }),
    /** Records a scan. Returns the pick result so the scanner can explain a rejected barcode. */
    scanItem: (orderId: string, barcode: string): PickResult => {
      const order = current(orderId);
      if (!order) {
        return {
          code: "ORDER_NOT_PICKING",
          message: LOCALE.orders.store.orderNotFound,
          ok: false,
        };
      }
      const result = PickingUtils.recordPick(order, barcode);
      if (result.ok) {
        showAndQueue(order, result.order, { barcode, type: "SCAN_ITEM" });
      }
      return result;
    },
    startPicking: (orderId: string) =>
      queue(orderId, { type: "START_PICKING" }),
  };
}
