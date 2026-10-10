/**
 * Mock sales API with simulated latency. This is the seam where a Supabase query
 * against the `sales` table will plug in.
 */
import { DEMO_SALES_SUMMARY } from '@/mocks/sales';

import type { StoreSalesSummary } from '../types';

const MOCK_LATENCY_MS = 500;

export async function fetchStoreSalesSummary(storeId: string): Promise<StoreSalesSummary> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
  if (storeId !== DEMO_SALES_SUMMARY.storeId) {
    throw new Error(`No sales data for store ${storeId}.`);
  }
  return { ...DEMO_SALES_SUMMARY, businessDate: new Date().toISOString().slice(0, 10) };
}
