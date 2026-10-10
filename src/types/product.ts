export type ProductCategory =
  | "SKINCARE"
  | "MAKEUP"
  | "FRAGRANCE"
  | "HAIRCARE"
  | "BODY_CARE";

export const PRODUCT_CATEGORIES: ReadonlyArray<ProductCategory> = [
  "SKINCARE",
  "MAKEUP",
  "FRAGRANCE",
  "HAIRCARE",
  "BODY_CARE",
];

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  SKINCARE: "Skincare",
  MAKEUP: "Makeup",
  FRAGRANCE: "Fragrance",
  HAIRCARE: "Haircare",
  BODY_CARE: "Body Care",
};

export type Product = {
  barcode: string;
  brand: string;
  category: ProductCategory;
  id: string;
  name: string;
  /** Retail price in AUD, GST inclusive. */
  price: number;
  size: string;
  sku: string;
  /** Tile colour behind the brand monogram, from the design mockups. */
  swatch?: string;
};
