import { MockServer } from "@/services/mock-api/mock-server";

import { createMockOrders } from "@/mocks/orders";
import { type Order } from "@/types/order";

/** Fixed clock so relative timestamps in mocks are deterministic. */
export const TEST_NOW = new Date("2026-10-10T12:00:00+11:00");

export const mockOrders = (): Array<Order> => createMockOrders(TEST_NOW);

/** Puts these orders on the mock server, with the server clock pinned to `now`. */
export function seedOrders(
  orders: Array<Order> = mockOrders(),
  now: Date = TEST_NOW,
): Promise<void> {
  return MockServer.seedForTest({ now, orders });
}
