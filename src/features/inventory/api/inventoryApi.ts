/** Mock inventory API with simulated latency. The Supabase `inventory` + `products` join plugs in here. */
import { createMockInventory } from '@/mocks/inventory';
import { DEMO_STORE_ID } from '@/mocks/store';

import type { InventoryItem } from '../types';

const MOCK_LATENCY_MS = 500;

export async function fetchInventory(storeId: string): Promise<InventoryItem[]> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
  if (storeId !== DEMO_STORE_ID) throw new Error(`No inventory for store ${storeId}.`);
  return createMockInventory();
}
