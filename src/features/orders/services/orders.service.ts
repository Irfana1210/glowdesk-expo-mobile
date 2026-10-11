/**
 * Orders API. Today it calls the in-app mock server; a real backend plugs in here and nothing
 * above this file changes.
 */
import { MockServer } from "@/services/mock-api/mock-server";

import { type OrderCommand } from "@/features/orders/domain/order-commands";

import { type Order } from "@/types/order";

export namespace OrdersService {
  export function fetchOrders(storeId: string): Promise<Array<Order>> {
    return MockServer.getOrders(storeId);
  }

  /** Sends one change. The server rejects it with a 409 if the order changed since `expectedVersion`. */
  export function updateOrder(input: {
    command: OrderCommand;
    expectedVersion: number;
    orderId: string;
  }): Promise<Order> {
    return MockServer.updateOrder(input);
  }
}
