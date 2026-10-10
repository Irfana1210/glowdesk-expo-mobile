/** Inventory rules: stock status, search, filtering and barcode lookup. Pure functions. */
import { LOCALE } from "@/constants/locale";

import { BarcodeUtils } from "@/utils/barcode-utils";

import { type ProductCategory } from "@/types/product";

import { type InventoryItem, type StockStatus } from "../types";

export type InventoryFilter = {
  category: ProductCategory | "ALL";
  lowStockOnly: boolean;
  query: string;
};

export type BarcodeLookupResult =
  | { item: InventoryItem; ok: true }
  | { code: "INVALID_BARCODE" | "NOT_FOUND"; message: string; ok: false };

export namespace StockUtils {
  export function stockStatus(
    availableQuantity: number,
    reorderPoint: number,
  ): StockStatus {
    if (availableQuantity <= 0) {
      return "OUT_OF_STOCK";
    }
    if (availableQuantity <= reorderPoint) {
      return "LOW_STOCK";
    }
    return "IN_STOCK";
  }

  export function itemStockStatus(item: InventoryItem): StockStatus {
    return stockStatus(item.availableQuantity, item.reorderPoint);
  }

  /** Low stock includes out of stock: both need replenishing. */
  export function needsReplenishment(item: InventoryItem): boolean {
    return itemStockStatus(item) !== "IN_STOCK";
  }

  export const EMPTY_FILTER: InventoryFilter = {
    query: "",
    category: "ALL",
    lowStockOnly: false,
  };

  /**
   * Case- and accent-insensitive match on name, brand and SKU. A query of digits
   * also matches barcodes, including a partial barcode typed from a label.
   */
  export function matchesQuery(item: InventoryItem, rawQuery: string): boolean {
    const fold = (text: string) =>
      text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    const query = fold(rawQuery.trim());
    if (query.length === 0) {
      return true;
    }

    const { product } = item;
    if (
      [product.name, product.brand, product.sku].some((field) =>
        fold(field).includes(query),
      )
    ) {
      return true;
    }

    const digits = query.replace(/\s+/g, "");
    return /^\d+$/.test(digits) && product.barcode.includes(digits);
  }

  export function filterInventory(
    items: Array<InventoryItem>,
    filter: InventoryFilter,
  ): Array<InventoryItem> {
    return items
      .filter(
        (item) =>
          filter.category === "ALL" ||
          item.product.category === filter.category,
      )
      .filter((item) => !filter.lowStockOnly || needsReplenishment(item))
      .filter((item) => matchesQuery(item, filter.query))
      .sort((a, b) => a.product.name.localeCompare(b.product.name));
  }

  export function countNeedingReplenishment(
    items: Array<InventoryItem>,
  ): number {
    return items.filter(needsReplenishment).length;
  }

  export function lookupByBarcode(
    items: Array<InventoryItem>,
    rawBarcode: string,
  ): BarcodeLookupResult {
    const barcode = BarcodeUtils.normaliseBarcode(rawBarcode);
    if (!barcode) {
      return {
        ok: false,
        code: "INVALID_BARCODE",
        message: LOCALE.inventory.barcodeLookup.invalid,
      };
    }
    const item = items.find((candidate) =>
      BarcodeUtils.barcodesMatch(candidate.product.barcode, barcode),
    );
    return item
      ? { ok: true, item }
      : {
          ok: false,
          code: "NOT_FOUND",
          message: LOCALE.inventory.barcodeLookup.notFound(barcode),
        };
  }
}
