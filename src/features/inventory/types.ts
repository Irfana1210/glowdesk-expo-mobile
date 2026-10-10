import type { Product } from '@/types/product';

/** Stock on hand for one product in one store (brief §11 `inventory` table, joined to `products`). */
export interface InventoryItem {
  storeId: string;
  product: Product;
  availableQuantity: number;
  /** At or below this quantity the item is flagged as low stock. */
  reorderPoint: number;
}

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
