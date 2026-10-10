import { memo } from "react";

import { LOCALE } from "@/constants/locale";

import { ProductRow } from "@/components/ui/product-row";

import { CATEGORY_LABELS } from "@/types/product";

import { StockUtils } from "../domain/stock";
import { STOCK_STATUS_META } from "../stock-status-meta";
import { type InventoryItem } from "../types";

const L = LOCALE.inventory.productCard;

export type ProductCardProps = {
  item: InventoryItem;
  onPress: (productId: string) => void;
};

/** Maps a stock record onto the shared ProductRow. */
function ProductCardComponent({ item, onPress }: ProductCardProps) {
  const { product } = item;
  const status = STOCK_STATUS_META[StockUtils.itemStockStatus(item)];
  const detail = L.detail(CATEGORY_LABELS[product.category], product.sku);
  return (
    <ProductRow
      accessibilityLabel={L.accessibilityLabel(
        product.brand,
        product.name,
        detail,
        item.availableQuantity,
        status.label,
      )}
      brand={product.brand}
      detail={detail}
      name={product.name}
      quantity={String(item.availableQuantity)}
      seed={product.id}
      size="large"
      swatch={product.swatch}
      testID={`PRODUCT_CARD.ROW.${product.id}`}
      trailing={{ kind: "status", status }}
      onPress={() => onPress(product.id)}
    />
  );
}

export const ProductCard = memo(ProductCardComponent);
