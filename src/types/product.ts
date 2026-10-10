export type ProductCategory = 'SKINCARE' | 'MAKEUP' | 'FRAGRANCE' | 'HAIRCARE' | 'BODY_CARE';

export const PRODUCT_CATEGORIES: readonly ProductCategory[] = [
  'SKINCARE',
  'MAKEUP',
  'FRAGRANCE',
  'HAIRCARE',
  'BODY_CARE',
];

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  SKINCARE: 'Skincare',
  MAKEUP: 'Makeup',
  FRAGRANCE: 'Fragrance',
  HAIRCARE: 'Haircare',
  BODY_CARE: 'Body Care',
};

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  brand: string;
  name: string;
  category: ProductCategory;
  /** Retail price in AUD, GST inclusive. */
  price: number;
  size: string;
  /** Tile colour behind the brand monogram, from the design mockups. */
  swatch?: string;
}
