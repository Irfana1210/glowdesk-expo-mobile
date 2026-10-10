/**
 * Stock on hand at RetailOS Melbourne Central, from the Inventory mockup.
 * A reorder point of 5 gives the mockup's statuses: 3 low, 1 out, 3 in stock.
 */
import type { InventoryItem } from '@/features/inventory/types';

import { MOCK_PRODUCTS, type MockProductKey } from './products';
import { DEMO_STORE_ID } from './store';

const REORDER_POINT = 5;

const ON_HAND: Record<MockProductKey, number> = {
  velourBlush: 3,
  hearthBodyButter: 0,
  koriHairOil: 2,
  petalLipOil: 4,
  lumenCream: 24,
  irisParfum: 11,
  saltwaterToner: 36,
};

export function createMockInventory(): InventoryItem[] {
  return (Object.keys(ON_HAND) as MockProductKey[]).map((key) => ({
    storeId: DEMO_STORE_ID,
    product: MOCK_PRODUCTS[key],
    availableQuantity: ON_HAND[key],
    reorderPoint: REORDER_POINT,
  }));
}
