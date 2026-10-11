/**
 * How order changes reach the server. Registered once on the QueryClient by mutation key, so a
 * change that was waiting offline can be resumed after the app restarts.
 *
 * - Queued changes (start picking, scan, assign) are shown straight away and can wait offline.
 * - Confirmed changes (mark ready, cancel) need the server. They are never shown early, because
 *   marking an order ready tells the customer it can be collected.
 *
 * Both share one scope, so changes reach the server one at a time, in the order they were made,
 * each carrying the version it was based on.
 *
 * A queued change that hits a temporary failure (server error, dropped connection) is retried
 * before anything else is sent. Rolling it back instead would strand every change queued after
 * it: they carry versions based on it, so the server would reject them all as conflicts.
 */
import { type QueryClient } from "@tanstack/react-query";

import { handleError } from "@/utils/handle-api-error";
import { MutationRetryUtils } from "@/utils/mutation-retry-utils";

import { ORDER_MUTATION_KEY, ORDERS_CACHE_KEY } from "@/services/cache-keys";

import { type OrderCommand } from "@/features/orders/domain/order-commands";

import { type Order } from "@/types/order";

import { OrdersService } from "../services/orders.service";

export type OrderUpdateVariables = {
  command: OrderCommand;
  expectedVersion: number;
  orderId: string;
  storeId: string;
};

export namespace OrderMutations {
  export const QUEUED_KEY = [ORDER_MUTATION_KEY, "queued"];
  export const CONFIRMED_KEY = [ORDER_MUTATION_KEY, "confirmed"];

  export function ordersQueryKey(storeId: string) {
    return [ORDERS_CACHE_KEY, storeId];
  }

  /** Replaces one order in the cached list. */
  export function writeOrder(
    client: QueryClient,
    storeId: string,
    order: Order,
  ): void {
    client.setQueryData<Array<Order>>(ordersQueryKey(storeId), (list) =>
      list?.map((o) => (o.id === order.id ? order : o)),
    );
  }

  export function register(client: QueryClient): void {
    const send = (v: OrderUpdateVariables) =>
      OrdersService.updateOrder({
        command: v.command,
        expectedVersion: v.expectedVersion,
        orderId: v.orderId,
      });

    // Refetch once the last change has settled. Refetching earlier would replace changes that are
    // still waiting with the server's older copy.
    const refetchWhenIdle = async (storeId: string) => {
      if (client.isMutating({ mutationKey: [ORDER_MUTATION_KEY] }) <= 1) {
        await client.invalidateQueries({ queryKey: ordersQueryKey(storeId) });
      }
    };

    // A rejected change is rolled back by reloading the server's copy, even if no screen is
    // showing the list right now.
    const rollBack = (storeId: string) =>
      client.invalidateQueries({
        queryKey: ordersQueryKey(storeId),
        refetchType: "all",
      });

    client.setMutationDefaults<Order, Error, OrderUpdateVariables>(QUEUED_KEY, {
      mutationFn: send,
      ...MutationRetryUtils.queued,
      onError: async (error, v) => {
        handleError(error);
        await rollBack(v.storeId);
      },
      onSettled: (_order, _error, v) => refetchWhenIdle(v.storeId),
      scope: { id: ORDER_MUTATION_KEY },
    });

    client.setMutationDefaults<Order, Error, OrderUpdateVariables>(
      CONFIRMED_KEY,
      {
        mutationFn: send,
        // Never wait in the queue: the screen checks the connection and explains instead.
        networkMode: "always",
        onError: (_error, v) => rollBack(v.storeId),
        onSettled: (_order, _error, v) => refetchWhenIdle(v.storeId),
        onSuccess: (order, v) => writeOrder(client, v.storeId, order),
        scope: { id: ORDER_MUTATION_KEY },
      },
    );
  }
}
