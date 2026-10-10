import { type FC, useCallback, useMemo, useState } from "react";
import {
  FlatList,
  type ListRenderItem,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";

import { Screen } from "@/components/layout/Screen";
import {
  AppText,
  ErrorState,
  FilterChips,
  type FilterOption,
  LoadingState,
  ScreenTitle,
  SearchBar,
  SecondaryButton,
} from "@/components/ui";

import { colors, fontFamily, radius, spacing, statusPalette } from "@/theme";
import {
  CATEGORY_LABELS,
  PRODUCT_CATEGORIES,
  type ProductCategory,
} from "@/types/product";

import { ProductCard } from "../components/ProductCard";
import {
  EMPTY_FILTER,
  filterInventory,
  type InventoryFilter,
  itemStockStatus,
} from "../domain/stock";
import { useInventory } from "../hooks/useInventory";
import { type InventoryItem } from "../types";

type CategoryFilter = ProductCategory | "ALL";

const CATEGORY_OPTIONS: Array<FilterOption<CategoryFilter>> = [
  { value: "ALL", label: "All" },
  ...PRODUCT_CATEGORIES.map((category) => ({
    value: category,
    label: CATEGORY_LABELS[category],
  })),
];

const keyExtractor = (item: InventoryItem) => item.product.id;
const Separator = () => <View style={styles.separator} />;

export const InventoryScreen: FC = () => {
  const router = useRouter();
  const inventory = useInventory();
  const items = useMemo(() => inventory.data ?? [], [inventory.data]);
  const [filter, setFilter] = useState<InventoryFilter>(EMPTY_FILTER);

  const counts = useMemo(
    () => ({
      products: items.length,
      low: items.filter((i) => itemStockStatus(i) === "LOW_STOCK").length,
      out: items.filter((i) => itemStockStatus(i) === "OUT_OF_STOCK").length,
    }),
    [items],
  );
  const visible = useMemo(
    () => filterInventory(items, filter),
    [items, filter],
  );

  const openProduct = useCallback(
    (productId: string) =>
      router.push({ pathname: "/inventory/[id]", params: { id: productId } }),
    [router],
  );
  const renderItem = useCallback<ListRenderItem<InventoryItem>>(
    ({ item }) => <ProductCard item={item} onPress={openProduct} />,
    [openProduct],
  );

  const hasFilters =
    filter.query.length > 0 || filter.category !== "ALL" || filter.lowStockOnly;
  const toggleLowStock = () =>
    setFilter((f) => ({ ...f, lowStockOnly: !f.lowStockOnly }));

  let body;
  if (inventory.isPending) {
    body = <LoadingState message="Loading inventory" />;
  } else if (inventory.isError) {
    body = (
      <ErrorState
        message={inventory.error.message}
        title="Couldn't load inventory"
        onRetry={() => void inventory.refetch()}
      />
    );
  } else {
    const emptyMessage = filter.query
      ? `No products match "${filter.query}".`
      : filter.lowStockOnly
        ? "Nothing is low or out of stock."
        : "No products in this category yet.";
    body = (
      <FlatList
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={
          <View style={styles.empty}>
            <AppText
              color="textMuted"
              style={styles.emptyText}
              testID="empty-state"
            >
              {emptyMessage}
            </AppText>
            {hasFilters ? (
              <SecondaryButton
                icon="close"
                label="Clear filters"
                onPress={() => setFilter(EMPTY_FILTER)}
              />
            ) : null}
          </View>
        }
        ListHeaderComponent={
          <View
            accessibilityLabel="Stock summary"
            accessibilityRole="toolbar"
            style={styles.summary}
          >
            <View
              accessible
              accessibilityLabel={`${counts.products} products`}
              style={[styles.tile, styles.tileNeutral]}
              testID="summary-products"
            >
              <AppText style={styles.tileValue}>{counts.products}</AppText>
              <AppText style={styles.tileLabel}>products</AppText>
            </View>
            <SummaryToggle
              label="low stock"
              selected={filter.lowStockOnly}
              testID="summary-low"
              tone="lowStock"
              value={counts.low}
              onPress={toggleLowStock}
            />
            <SummaryToggle
              label="out of stock"
              selected={filter.lowStockOnly}
              testID="summary-out"
              tone="outOfStock"
              value={counts.out}
              onPress={toggleLowStock}
            />
          </View>
        }
        contentContainerStyle={styles.listContent}
        data={visible}
        initialNumToRender={12}
        keyExtractor={keyExtractor}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            colors={[colors.accent]}
            refreshing={inventory.isRefetching}
            tintColor={colors.accent}
            onRefresh={() => void inventory.refetch()}
          />
        }
        renderItem={renderItem}
        testID="inventory-list"
      />
    );
  }

  return (
    <Screen testID="inventory-screen">
      <ScreenTitle eyebrow="Stock on hand" title="Inventory" />
      <View style={styles.searchRow}>
        <SearchBar
          accessibilityLabel="Search inventory by product, SKU or barcode"
          placeholder="Product, SKU or barcode"
          testID="inventory-search"
          value={filter.query}
          onChangeText={(query) => setFilter((f) => ({ ...f, query }))}
        />
        <Pressable
          accessibilityLabel="Scan a barcode"
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.scanButton,
            pressed && styles.pressed,
          ]}
          testID="inventory-scan"
          onPress={() => router.push("/inventory/scan")}
        >
          <Ionicons color={colors.textOnDark} name="scan-outline" size={22} />
        </Pressable>
      </View>
      <View style={styles.chips}>
        <FilterChips
          accessibilityLabel="Filter by category"
          options={CATEGORY_OPTIONS}
          selected={filter.category}
          onChange={(category) => setFilter((f) => ({ ...f, category }))}
        />
      </View>
      {body}
    </Screen>
  );
};

type SummaryToggleProps = {
  label: string;
  onPress: () => void;
  selected: boolean;
  testID: string;
  tone: "lowStock" | "outOfStock";
  value: number;
};

/** Tinted count tile. Pressing it narrows the list to products that need restocking. */
function SummaryToggle({
  testID,
  value,
  label,
  tone,
  selected,
  onPress,
}: SummaryToggleProps) {
  const palette = statusPalette[tone];
  return (
    <Pressable
      accessibilityHint={
        selected
          ? "Shows all products again"
          : "Shows only products that need restocking"
      }
      accessibilityLabel={`${value} ${label}`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: palette.background },
        selected && { borderColor: palette.text },
        pressed && styles.pressed,
      ]}
      testID={testID}
      onPress={onPress}
    >
      <AppText style={[styles.tileValue, { color: palette.text }]}>
        {value}
      </AppText>
      <AppText style={[styles.tileLabel, { color: palette.text }]}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingBottom: 14,
  },
  scanButton: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.inverse,
  },
  pressed: { opacity: 0.85 },
  chips: { paddingBottom: spacing.sm },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
  },
  summary: { flexDirection: "row", gap: spacing.sm, marginBottom: 10 },
  tile: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "transparent",
  },
  tileNeutral: { backgroundColor: colors.surface, borderColor: colors.border },
  tileValue: {
    fontFamily: fontFamily.semibold,
    fontSize: 20,
    lineHeight: 26,
    color: colors.text,
  },
  tileLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    lineHeight: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  separator: { height: 10 },
  empty: { alignItems: "center", gap: spacing.lg, paddingVertical: spacing.xl },
  emptyText: { textAlign: "center" },
});
