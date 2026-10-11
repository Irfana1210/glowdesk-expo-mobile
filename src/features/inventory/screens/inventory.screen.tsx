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

import { LOCALE } from "@/constants/locale";

import { useTabBarInset } from "@/hooks/use-tab-bar-inset";

import { Screen } from "@/components/layout/screen";
import { AppText } from "@/components/ui/app-text";
import { ErrorState } from "@/components/ui/error-state";
import { FilterChips, type FilterOption } from "@/components/ui/filter-chips";
import { LoadingState } from "@/components/ui/loading-state";
import { ScreenTitle } from "@/components/ui/screen-title";
import { SearchBar } from "@/components/ui/search-bar";
import { SecondaryButton } from "@/components/ui/secondary-button";

import { colors, fontFamily, radius, spacing, statusPalette } from "@/theme";
import {
  CATEGORY_LABELS,
  PRODUCT_CATEGORIES,
  type ProductCategory,
} from "@/types/product";

import { ProductCard } from "../components/product-card";
import { type InventoryFilter, StockUtils } from "../domain/stock";
import { useInventory } from "../hooks/use-inventory";
import { type InventoryItem } from "../types";

const L = LOCALE.inventory.list;

type CategoryFilter = ProductCategory | "ALL";

const CATEGORY_OPTIONS: Array<FilterOption<CategoryFilter>> = [
  { value: "ALL", label: L.allCategories },
  ...PRODUCT_CATEGORIES.map((category) => ({
    value: category,
    label: CATEGORY_LABELS[category],
  })),
];

const keyExtractor = (item: InventoryItem) => item.product.id;
const Separator = () => <View style={styles.separator} />;

export const InventoryScreen: FC = () => {
  const router = useRouter();
  const tabBarInset = useTabBarInset();
  const inventory = useInventory();
  const items = useMemo(() => inventory.data ?? [], [inventory.data]);
  const [filter, setFilter] = useState<InventoryFilter>(
    StockUtils.EMPTY_FILTER,
  );

  const counts = useMemo(
    () => ({
      products: items.length,
      low: items.filter((i) => StockUtils.itemStockStatus(i) === "LOW_STOCK")
        .length,
      out: items.filter((i) => StockUtils.itemStockStatus(i) === "OUT_OF_STOCK")
        .length,
    }),
    [items],
  );
  const visible = useMemo(
    () => StockUtils.filterInventory(items, filter),
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
    body = <LoadingState message={L.loading} />;
  } else if (inventory.isError) {
    body = (
      <ErrorState
        message={inventory.error.message}
        title={L.errorTitle}
        onRetry={() => void inventory.refetch()}
      />
    );
  } else {
    const emptyMessage = filter.query
      ? L.empty.noMatch(filter.query)
      : filter.lowStockOnly
        ? L.empty.noLowStock
        : L.empty.noProducts;
    body = (
      <FlatList
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={
          <View style={styles.empty}>
            <AppText
              color="textMuted"
              style={styles.emptyText}
              testID="INVENTORY.EMPTY_STATE"
            >
              {emptyMessage}
            </AppText>
            {hasFilters ? (
              <SecondaryButton
                icon="close"
                label={L.clearFilters}
                onPress={() => setFilter(StockUtils.EMPTY_FILTER)}
              />
            ) : null}
          </View>
        }
        ListHeaderComponent={
          <View
            accessibilityLabel={L.summary.label}
            accessibilityRole="toolbar"
            style={styles.summary}
          >
            <View
              accessible
              accessibilityLabel={L.summary.countLabel(
                counts.products,
                L.summary.products,
              )}
              style={[styles.tile, styles.tileNeutral]}
              testID="INVENTORY.SUMMARY_PRODUCTS"
            >
              <AppText style={styles.tileValue}>{counts.products}</AppText>
              <AppText style={styles.tileLabel}>{L.summary.products}</AppText>
            </View>
            <SummaryToggle
              label={L.summary.lowStock}
              selected={filter.lowStockOnly}
              testID="INVENTORY.SUMMARY_LOW"
              tone="lowStock"
              value={counts.low}
              onPress={toggleLowStock}
            />
            <SummaryToggle
              label={L.summary.outOfStock}
              selected={filter.lowStockOnly}
              testID="INVENTORY.SUMMARY_OUT"
              tone="outOfStock"
              value={counts.out}
              onPress={toggleLowStock}
            />
          </View>
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarInset },
        ]}
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
        testID="INVENTORY.LIST"
      />
    );
  }

  return (
    <Screen testID="INVENTORY.SCREEN">
      <ScreenTitle eyebrow={L.eyebrow} title={L.title} />
      <View style={styles.searchRow}>
        <SearchBar
          accessibilityLabel={L.searchLabel}
          placeholder={L.searchPlaceholder}
          testID="INVENTORY.SEARCH"
          value={filter.query}
          onChangeText={(query) => setFilter((f) => ({ ...f, query }))}
        />
        <Pressable
          accessibilityLabel={L.scanLabel}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.scanButton,
            pressed && styles.pressed,
          ]}
          testID="INVENTORY.SCAN"
          onPress={() => router.push("/inventory/scan")}
        >
          <Ionicons color={colors.textOnDark} name="scan-outline" size={22} />
        </Pressable>
      </View>
      <View style={styles.chips}>
        <FilterChips
          accessibilityLabel={L.categoryFilterLabel}
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
        selected ? L.summary.showAllHint : L.summary.showRestockHint
      }
      accessibilityLabel={L.summary.countLabel(value, label)}
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
    backgroundColor: colors.primary,
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
