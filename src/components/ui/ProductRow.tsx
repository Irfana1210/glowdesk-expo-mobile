import Ionicons from '@expo/vector-icons/Ionicons';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, fontFamily, spacing, statusPalette } from '@/theme';

import { AppText } from './AppText';
import { ProductThumbnail } from './ProductThumbnail';
import { StatusBadge, type StatusBadgeProps } from './StatusBadge';

export type ProductRowTrailing =
  | { kind: 'status'; status: StatusBadgeProps }
  | { kind: 'verified' }
  | { kind: 'toScan' };

export interface ProductRowProps {
  /** Stable key for the tile tint. */
  seed: string;
  brand: string;
  name: string;
  /** Third line, e.g. "SKU LS-1042 · 9300601042118" or "Skincare · SKU LS-1042". */
  detail: string;
  /** Right-hand number, e.g. "1 / 2" when picking or "24" on hand. */
  quantity: string;
  trailing: ProductRowTrailing;
  swatch?: string;
  /** Inventory uses a larger tile and quantity. */
  size?: 'default' | 'large';
  accessibilityLabel: string;
  onPress?: () => void;
  testID?: string;
}

/** One product line: brand tile, brand, name, detail, quantity and status. */
function ProductRowComponent({
  seed,
  brand,
  name,
  detail,
  quantity,
  trailing,
  swatch,
  size = 'default',
  accessibilityLabel,
  onPress,
  testID,
}: ProductRowProps) {
  const large = size === 'large';
  const content = (
    <>
      <ProductThumbnail seed={seed} label={brand} swatch={swatch} size={large ? 52 : 48} />
      <View style={styles.body}>
        <AppText style={styles.brand} numberOfLines={1}>
          {brand.toUpperCase()}
        </AppText>
        <AppText style={styles.name} numberOfLines={2}>
          {name}
        </AppText>
        <AppText style={styles.detail} numberOfLines={1}>
          {detail}
        </AppText>
      </View>
      <View style={styles.trailing}>
        <AppText style={[styles.quantity, large && styles.quantityLarge]}>{quantity}</AppText>
        {trailing.kind === 'status' ? (
          <StatusBadge {...trailing.status} size="small" />
        ) : trailing.kind === 'verified' ? (
          <View style={styles.verified}>
            <Ionicons name="checkmark" size={12} color={colors.successDark} />
            <AppText style={[styles.state, styles.verifiedText]}>Verified</AppText>
          </View>
        ) : (
          <AppText style={[styles.state, styles.toScan]}>To scan</AppText>
        )}
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        testID={testID}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        {content}
      </Pressable>
    );
  }
  return (
    <View testID={testID} accessible accessibilityLabel={accessibilityLabel} style={styles.row}>
      {content}
    </View>
  );
}

export const ProductRow = memo(ProductRowComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.85 },
  body: { flex: 1, minWidth: 0, gap: 2 },
  brand: { fontFamily: fontFamily.semibold, fontSize: 11, lineHeight: 14, letterSpacing: 0.66, color: colors.textMuted },
  name: { fontFamily: fontFamily.semibold, fontSize: 14, lineHeight: 19, color: colors.text },
  detail: { fontFamily: fontFamily.regular, fontSize: 11, lineHeight: 14, color: colors.textMuted },
  trailing: { alignItems: 'flex-end', gap: spacing.xs, flexShrink: 0 },
  quantity: { fontFamily: fontFamily.semibold, fontSize: 15, lineHeight: 20, color: colors.text },
  quantityLarge: { fontSize: 18, lineHeight: 22 },
  verified: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  state: { fontFamily: fontFamily.semibold, fontSize: 11, lineHeight: 14 },
  verifiedText: { color: statusPalette.ready.text },
  toScan: { color: colors.textMuted },
});

