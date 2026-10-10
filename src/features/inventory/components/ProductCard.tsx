import Ionicons from '@expo/vector-icons/Ionicons';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, ProductThumbnail, StatusBadge } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { CATEGORY_LABELS } from '@/types/product';

import { itemStockStatus } from '../domain/stock';
import { STOCK_STATUS_META } from '../stockStatusMeta';
import type { InventoryItem } from '../types';

export interface ProductCardProps {
  item: InventoryItem;
  onPress: (productId: string) => void;
}

function ProductCardComponent({ item, onPress }: ProductCardProps) {
  const { product } = item;
  const status = STOCK_STATUS_META[itemStockStatus(item)];
  const label = [
    `${product.brand} ${product.name}`,
    CATEGORY_LABELS[product.category],
    `SKU ${product.sku}`,
    `${item.availableQuantity} available`,
    status.label,
  ].join(', ');

  return (
    <Pressable
      testID={`product-card-${product.id}`}
      onPress={() => onPress(product.id)}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Opens product details"
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <ProductThumbnail seed={product.id} label={product.brand} />
      <View style={styles.body}>
        <AppText variant="supporting" color="textMuted" numberOfLines={1}>
          {product.brand}
        </AppText>
        <AppText variant="bodyStrong" numberOfLines={2}>
          {product.name}
        </AppText>
        <AppText variant="supporting" color="textMuted">
          SKU {product.sku}
        </AppText>
      </View>
      <View style={styles.stock}>
        <AppText variant="sectionTitle">{item.availableQuantity}</AppText>
        <StatusBadge {...status} />
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

export const ProductCard = memo(ProductCardComponent);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.8 },
  body: { flex: 1, gap: 2 },
  stock: { alignItems: 'flex-end', gap: spacing.xs },
});
