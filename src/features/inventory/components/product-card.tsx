import { memo } from "react";

import { ProductRow } from "@/components/ui/product-row";

import { CATEGORY_LABELS } from "@/types/product";

import { itemStockStatus } from "../domain/stock";
import { STOCK_STATUS_META } from "../stock-status-meta";
import { type InventoryItem } from "../types";

export type ProductCardProps = {
  item: InventoryItem;
  onPress: (productId: string) => void;
};

/** Maps a stock record onto the shared ProductRow. */
function ProductCardComponent({ item, onPress }: ProductCardProps) {
  const { product } = item;
  const status = STOCK_STATUS_META[itemStockStatus(item)];
  const detail = `${CATEGORY_LABELS[product.category]} · SKU ${product.sku}`;
  return (
    <ProductRow
      accessibilityLabel={`${product.brand} ${product.name}, ${detail}, ${item.availableQuantity} on hand, ${status.label}`}
      brand={product.brand}
      detail={detail}
      name={product.name}
      quantity={String(item.availableQuantity)}
      seed={product.id}
      size="large"
      swatch={product.swatch}
      testID={`product-row-${product.id}`}
      trailing={{ kind: "status", status }}
      onPress={() => onPress(product.id)}
    />
  );
}

export const ProductCard = memo(ProductCardComponent);
