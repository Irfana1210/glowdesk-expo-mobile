/**
 * Mock orders API. It mimics network latency so loading states are real.
 * This is the seam where a Supabase client (behind TanStack Query) will plug in later.
 */
import { MockUtils } from "@/utils/mock-utils";

import { createMockOrders } from "@/mocks/orders";
import { type Order } from "@/types/order";

export namespace OrdersService {
  export async function fetchOrders(): Promise<Array<Order>> {
    await MockUtils.simulateLatency();
    return createMockOrders();
  }
}
