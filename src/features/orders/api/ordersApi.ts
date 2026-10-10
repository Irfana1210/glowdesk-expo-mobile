/**
 * Mock orders API. It mimics network latency so loading states are real.
 * This is the seam where a Supabase client (behind TanStack Query) will plug in later.
 */
import { createMockOrders } from '@/mocks/orders';
import type { Order } from '@/types/order';

const MOCK_LATENCY_MS = 600;

export async function fetchOrders(): Promise<Order[]> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
  return createMockOrders();
}
