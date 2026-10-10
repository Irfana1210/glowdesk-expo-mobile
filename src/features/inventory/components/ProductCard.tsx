import { memo } from 'react';

import { ProductRow } from '@/components/ui';
import { CATEGORY_LABELS } from '@/types/product';

import { itemStockStatus } from '../domain/stock';
import { STOCK_STATUS_META } from '../stockStatusMeta';
import type { InventoryItem } from '../types';

export interface ProductCardProps {
  item: InventoryItem;
  onPress: (productId: string) => void;
}

/** Maps a stock record onto the shared ProductRow. */
function ProductCardComponent({ item, onPress }: ProductCardProps) {
  const { product } = item;
  const status = STOCK_STATUS_META[itemStockStatus(item)];
  const detail = `${CATEGORY_LABELS[product.category]} · SKU ${product.sku}`;
  return (
    <ProductRow
      testID={`product-row-${product.id}`}
      seed={product.id}
      swatch={product.swatch}
      brand={product.brand}
      name={product.name}
      detail={detail}
      quantity={String(item.availableQuantity)}
      trailing={{ kind: 'status', status }}
      size="large"
      onPress={() => onPress(product.id)}
      accessibilityLabel={`${product.brand} ${product.name}, ${detail}, ${item.availableQuantity} on hand, ${status.label}`}
    />
  );
}

export const ProductCard = memo(ProductCardComponent);
