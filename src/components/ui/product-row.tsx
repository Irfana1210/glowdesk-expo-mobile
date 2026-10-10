import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";

import { LOCALE } from "@/constants/locale";

import { colors, fontFamily, spacing, statusPalette } from "@/theme";

import { AppText } from "./app-text";
import { ProductThumbnail } from "./product-thumbnail";
import { StatusBadge, type StatusBadgeProps } from "./status-badge";

const L = LOCALE.components.productRow;

export type ProductRowTrailing =
  | { kind: "status"; status: StatusBadgeProps }
  | { kind: "verified" }
  | { kind: "toScan" };

export type ProductRowProps = {
  accessibilityLabel: string;
  brand: string;
  /** Third line, e.g. "SKU LS-1042 · 9300601042118" or "Skincare · SKU LS-1042". */
  detail: string;
  name: string;
  onPress?: () => void;
  /** Right-hand number, e.g. "1 / 2" when picking or "24" on hand. */
  quantity: string;
  /** Stable key for the tile tint. */
  seed: string;
  /** Inventory uses a larger tile and quantity. */
  size?: "default" | "large";
  swatch?: string;
  testID?: string;
  trailing: ProductRowTrailing;
};

/** One product line: brand tile, brand, name, detail, quantity and status. */
function ProductRowComponent({
  seed,
  brand,
  name,
  detail,
  quantity,
  trailing,
  swatch,
  size = "default",
  accessibilityLabel,
  onPress,
  testID,
}: ProductRowProps) {
  const large = size === "large";
  const content = (
    <>
      <ProductThumbnail
        label={brand}
        seed={seed}
        size={large ? 52 : 48}
        swatch={swatch}
      />
      <View style={styles.body}>
        <AppText numberOfLines={1} style={styles.brand}>
          {brand.toUpperCase()}
        </AppText>
        <AppText numberOfLines={2} style={styles.name}>
          {name}
        </AppText>
        <AppText numberOfLines={1} style={styles.detail}>
          {detail}
        </AppText>
      </View>
      <View style={styles.trailing}>
        <AppText style={[styles.quantity, large && styles.quantityLarge]}>
          {quantity}
        </AppText>
        {trailing.kind === "status" ? (
          <StatusBadge {...trailing.status} size="small" />
        ) : trailing.kind === "verified" ? (
          <View style={styles.verified}>
            <Ionicons color={colors.successDark} name="checkmark" size={12} />
            <AppText style={[styles.state, styles.verifiedText]}>
              {L.verified}
            </AppText>
          </View>
        ) : (
          <AppText style={[styles.state, styles.toScan]}>{L.toScan}</AppText>
        )}
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        testID={testID}
        onPress={onPress}
      >
        {content}
      </Pressable>
    );
  }
  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      style={styles.row}
      testID={testID}
    >
      {content}
    </View>
  );
}

export const ProductRow = memo(ProductRowComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.85 },
  body: { flex: 1, minWidth: 0, gap: 2 },
  brand: {
    fontFamily: fontFamily.semibold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.66,
    color: colors.textMuted,
  },
  name: {
    fontFamily: fontFamily.semibold,
    fontSize: 14,
    lineHeight: 19,
    color: colors.text,
  },
  detail: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    lineHeight: 14,
    color: colors.textMuted,
  },
  trailing: { alignItems: "flex-end", gap: spacing.xs, flexShrink: 0 },
  quantity: {
    fontFamily: fontFamily.semibold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  quantityLarge: { fontSize: 18, lineHeight: 22 },
  verified: { flexDirection: "row", alignItems: "center", gap: 3 },
  state: { fontFamily: fontFamily.semibold, fontSize: 11, lineHeight: 14 },
  verifiedText: { color: statusPalette.ready.text },
  toScan: { color: colors.textMuted },
});
