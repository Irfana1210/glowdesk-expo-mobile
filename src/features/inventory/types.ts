import { type Product } from "@/types/product";

/** Stock on hand for one product in one store (the `inventory` table, joined to `products`). */
export type InventoryItem = {
  availableQuantity: number;
  product: Product;
  /** At or below this quantity the item is flagged as low stock. */
  reorderPoint: number;
  storeId: string;
};

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
