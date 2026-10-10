/** Inventory rules: stock status, search, filtering and barcode lookup. Pure functions. */
import { barcodesMatch, normaliseBarcode } from '@/lib/barcode';
import type { ProductCategory } from '@/types/product';

import type { InventoryItem, StockStatus } from '../types';

export function stockStatus(availableQuantity: number, reorderPoint: number): StockStatus {
  if (availableQuantity <= 0) return 'OUT_OF_STOCK';
  if (availableQuantity <= reorderPoint) return 'LOW_STOCK';
  return 'IN_STOCK';
}

export function itemStockStatus(item: InventoryItem): StockStatus {
  return stockStatus(item.availableQuantity, item.reorderPoint);
}

/** Low stock includes out of stock: both need replenishing. */
export function needsReplenishment(item: InventoryItem): boolean {
  return itemStockStatus(item) !== 'IN_STOCK';
}

export interface InventoryFilter {
  query: string;
  category: ProductCategory | 'ALL';
  lowStockOnly: boolean;
}

export const EMPTY_FILTER: InventoryFilter = { query: '', category: 'ALL', lowStockOnly: false };

/**
 * Case- and accent-insensitive match on name, brand and SKU. A query of digits
 * also matches barcodes, including a partial barcode typed from a label.
 */
export function matchesQuery(item: InventoryItem, rawQuery: string): boolean {
  const fold = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const query = fold(rawQuery.trim());
  if (query.length === 0) return true;

  const { product } = item;
  if ([product.name, product.brand, product.sku].some((field) => fold(field).includes(query))) return true;

  const digits = query.replace(/\s+/g, '');
  return /^\d+$/.test(digits) && product.barcode.includes(digits);
}

export function filterInventory(items: InventoryItem[], filter: InventoryFilter): InventoryItem[] {
  return items
    .filter((item) => filter.category === 'ALL' || item.product.category === filter.category)
    .filter((item) => !filter.lowStockOnly || needsReplenishment(item))
    .filter((item) => matchesQuery(item, filter.query))
    .sort((a, b) => a.product.name.localeCompare(b.product.name));
}

export function countNeedingReplenishment(items: InventoryItem[]): number {
  return items.filter(needsReplenishment).length;
}

export type BarcodeLookupResult =
  | { ok: true; item: InventoryItem }
  | { ok: false; code: 'INVALID_BARCODE' | 'NOT_FOUND'; message: string };

export function findByBarcode(items: InventoryItem[], rawBarcode: string): BarcodeLookupResult {
  const barcode = normaliseBarcode(rawBarcode);
  if (!barcode) return { ok: false, code: 'INVALID_BARCODE', message: 'Enter a valid barcode of 8 to 14 digits.' };
  const item = items.find((candidate) => barcodesMatch(candidate.product.barcode, barcode));
  return item
    ? { ok: true, item }
    : { ok: false, code: 'NOT_FOUND', message: `No product in this store has barcode ${barcode}.` };
}
