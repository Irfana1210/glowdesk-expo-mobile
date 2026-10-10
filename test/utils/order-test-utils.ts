import { useOrdersStore } from "@/features/orders/store/orders.store";

import { createMockOrders } from "@/mocks/orders";
import { type Order } from "@/types/order";

/** Fixed clock so relative timestamps in mocks are deterministic. */
export const TEST_NOW = new Date("2026-10-10T12:00:00+11:00");

export const mockOrders = (): Array<Order> => createMockOrders(TEST_NOW);

export function resetOrdersStore(
  overrides: Partial<ReturnType<typeof useOrdersStore.getState>> = {},
) {
  useOrdersStore.setState(
    { ...useOrdersStore.getInitialState(), ...overrides },
    true,
  );
}
