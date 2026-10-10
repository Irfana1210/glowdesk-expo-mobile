import {
  EMPTY_FILTER,
  countNeedingReplenishment,
  filterInventory,
  findByBarcode,
  matchesQuery,
  stockStatus,
} from '@/features/inventory/domain/stock';
import { createMockInventory } from '@/mocks/inventory';
import { MOCK_PRODUCTS } from '@/mocks/products';

const inventory = createMockInventory();
const item = (sku: string) => {
  const found = inventory.find((i) => i.product.sku === sku);
  if (!found) throw new Error(`missing ${sku}`);
  return found;
};
const skus = (items: typeof inventory) => items.map((i) => i.product.sku).sort();

describe('stockStatus', () => {
  it.each([
    [10, 5, 'IN_STOCK'],
    [5, 5, 'LOW_STOCK'],
    [1, 5, 'LOW_STOCK'],
    [0, 5, 'OUT_OF_STOCK'],
    [-2, 5, 'OUT_OF_STOCK'],
    [0, 0, 'OUT_OF_STOCK'],
    [1, 0, 'IN_STOCK'],
  ] as const)('%i available with reorder point %i is %s', (available, reorderPoint, expected) => {
    expect(stockStatus(available, reorderPoint)).toBe(expected);
  });
});

describe('matchesQuery', () => {
  const cream = item(MOCK_PRODUCTS.lumenCream.sku);

  it.each(['dewy', 'DEWY', 'lumen', 'ls-10', '  cream  '])('matches %p', (query) => {
    expect(matchesQuery(cream, query)).toBe(true);
  });

  it('ignores accents, so "kori" finds Kōri', () => {
    expect(matchesQuery(item(MOCK_PRODUCTS.koriHairOil.sku), 'kori')).toBe(true);
  });

  it('matches full and partial barcodes', () => {
    expect(matchesQuery(cream, MOCK_PRODUCTS.lumenCream.barcode)).toBe(true);
    expect(matchesQuery(cream, MOCK_PRODUCTS.lumenCream.barcode.slice(-5))).toBe(true);
  });

  it('does not match unrelated text, and matches everything for an empty query', () => {
    expect(matchesQuery(cream, 'parfum')).toBe(false);
    expect(matchesQuery(cream, '   ')).toBe(true);
  });
});

describe('filterInventory', () => {
  it('returns every item sorted by name with no filter', () => {
    const names = filterInventory(inventory, EMPTY_FILTER).map((i) => i.product.name);
    expect(names).toHaveLength(7);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it('filters by category', () => {
    expect(skus(filterInventory(inventory, { ...EMPTY_FILTER, category: 'SKINCARE' }))).toEqual(['LS-1042', 'SW-0381']);
    expect(skus(filterInventory(inventory, { ...EMPTY_FILTER, category: 'FRAGRANCE' }))).toEqual(['MI-0730']);
  });

  it('shows only low and out of stock items when asked', () => {
    expect(skus(filterInventory(inventory, { ...EMPTY_FILTER, lowStockOnly: true }))).toEqual(
      ['HH-1180', 'KR-0555', 'PP-0917', 'VL-2210'],
    );
  });

  it('combines category, low stock and search', () => {
    expect(skus(filterInventory(inventory, { query: 'petal', category: 'MAKEUP', lowStockOnly: true }))).toEqual(['PP-0917']);
  });

  it('counts items needing replenishment', () => {
    expect(countNeedingReplenishment(inventory)).toBe(4);
    expect(countNeedingReplenishment([])).toBe(0);
  });
});

describe('findByBarcode', () => {
  it('finds a product by its barcode', () => {
    const result = findByBarcode(inventory, MOCK_PRODUCTS.koriHairOil.barcode);
    expect(result.ok && result.item.product.name).toBe('Bond Repair Hair Oil 30ml');
  });

  it('reports unknown barcodes and rejects malformed input', () => {
    expect(findByBarcode(inventory, '9999999999994')).toMatchObject({ ok: false, code: 'NOT_FOUND' });
    expect(findByBarcode(inventory, 'abc')).toMatchObject({ ok: false, code: 'INVALID_BARCODE' });
  });
});
