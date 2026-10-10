/**
 * Fictional beauty catalogue from the design mockups (docs/screens/OrderDetails and Inventory).
 * Every brand and product is invented for this portfolio project.
 */
import { type Product } from "@/types/product";

/** Appends a valid EAN-13 check digit to a 12-digit body. Used for the two codes the mockups omit. */
export function withEan13CheckDigit(body: string): string {
  const sum = body
    .split("")
    .reduce(
      (acc, digit, index) => acc + Number(digit) * (index % 2 === 0 ? 1 : 3),
      0,
    );
  return `${body}${(10 - (sum % 10)) % 10}`;
}

export const MOCK_PRODUCTS = {
  lumenCream: {
    id: "prod-ls-1042",
    sku: "LS-1042",
    barcode: "9300601042118",
    brand: "Lumen Skin",
    name: "Dewy Barrier Cream 50ml",
    category: "SKINCARE",
    price: 68,
    size: "50 mL",
    swatch: "#F3E3E7",
  },
  velourBlush: {
    id: "prod-vl-2210",
    sku: "VL-2210",
    barcode: "9300602210457",
    brand: "Velour",
    name: "Soft Focus Blush · Rosewood",
    category: "MAKEUP",
    price: 42,
    size: "6 g",
    swatch: "#EAD9CF",
  },
  saltwaterToner: {
    id: "prod-sw-0381",
    sku: "SW-0381",
    barcode: "9300600381206",
    brand: "Saltwater Botanica",
    name: "Sea Mist Toner 150ml",
    category: "SKINCARE",
    price: 38,
    size: "150 mL",
    swatch: "#DCE8E4",
  },
  petalLipOil: {
    id: "prod-pp-0917",
    sku: "PP-0917",
    barcode: "9300600917734",
    brand: "Petal & Pith",
    name: "Cloud Lip Oil · Fig",
    category: "MAKEUP",
    price: 32,
    size: "6 mL",
    swatch: "#ECE6F0",
  },
  koriHairOil: {
    id: "prod-kr-0555",
    sku: "KR-0555",
    barcode: "9300600555943",
    brand: "Kōri",
    name: "Bond Repair Hair Oil 30ml",
    category: "HAIRCARE",
    price: 49,
    size: "30 mL",
    swatch: "#F2EBDD",
  },
  hearthBodyButter: {
    id: "prod-hh-1180",
    sku: "HH-1180",
    barcode: withEan13CheckDigit("930060118036"),
    brand: "Hearth & Hollow",
    name: "Whipped Body Butter 200ml",
    category: "BODY_CARE",
    price: 44,
    size: "200 mL",
    swatch: "#E6E1DC",
  },
  irisParfum: {
    id: "prod-mi-0730",
    sku: "MI-0730",
    barcode: withEan13CheckDigit("930060073028"),
    brand: "Maison Iris",
    name: "Fig Leaf Eau de Parfum 50ml",
    category: "FRAGRANCE",
    price: 189,
    size: "50 mL",
    swatch: "#DDE3EC",
  },
} as const satisfies Record<string, Product>;

export type MockProductKey = keyof typeof MOCK_PRODUCTS;

export const MOCK_CATALOGUE: Array<Product> = Object.values(MOCK_PRODUCTS);

const SWATCH_BY_ID = new Map<string, string | undefined>(
  MOCK_CATALOGUE.map((p) => [p.id, p.swatch]),
);

/** Tile colour for a product ID. Stands in for the image a catalogue service would provide. */
export function productSwatch(productId: string): string | undefined {
  return SWATCH_BY_ID.get(productId);
}
