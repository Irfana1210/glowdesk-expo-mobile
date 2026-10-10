import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View, type ListRenderItem } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import {
  AppText,
  ErrorState,
  FilterChips,
  LoadingState,
  ScreenTitle,
  SearchBar,
  SecondaryButton,
  type FilterOption,
} from '@/components/ui';
import { colors, fontFamily, radius, spacing, statusPalette } from '@/theme';
import { CATEGORY_LABELS, PRODUCT_CATEGORIES, type ProductCategory } from '@/types/product';

import { ProductCard } from '../components/ProductCard';
import { EMPTY_FILTER, filterInventory, itemStockStatus, type InventoryFilter } from '../domain/stock';
import { useInventory } from '../hooks/useInventory';
import type { InventoryItem } from '../types';

type CategoryFilter = ProductCategory | 'ALL';

const CATEGORY_OPTIONS: FilterOption<CategoryFilter>[] = [
  { value: 'ALL', label: 'All' },
  ...PRODUCT_CATEGORIES.map((category) => ({ value: category, label: CATEGORY_LABELS[category] })),
];

const keyExtractor = (item: InventoryItem) => item.product.id;
const Separator = () => <View style={styles.separator} />;

export function InventoryScreen() {
  const router = useRouter();
  const inventory = useInventory();
  const items = useMemo(() => inventory.data ?? [], [inventory.data]);
  const [filter, setFilter] = useState<InventoryFilter>(EMPTY_FILTER);

  const counts = useMemo(
    () => ({
      products: items.length,
      low: items.filter((i) => itemStockStatus(i) === 'LOW_STOCK').length,
      out: items.filter((i) => itemStockStatus(i) === 'OUT_OF_STOCK').length,
    }),
    [items],
  );
  const visible = useMemo(() => filterInventory(items, filter), [items, filter]);

  const openProduct = useCallback(
    (productId: string) => router.push({ pathname: '/inventory/[id]', params: { id: productId } }),
    [router],
  );
  const renderItem = useCallback<ListRenderItem<InventoryItem>>(
    ({ item }) => <ProductCard item={item} onPress={openProduct} />,
    [openProduct],
  );

  const hasFilters = filter.query.length > 0 || filter.category !== 'ALL' || filter.lowStockOnly;
  const toggleLowStock = () => setFilter((f) => ({ ...f, lowStockOnly: !f.lowStockOnly }));

  let body;
  if (inventory.isPending) {
    body = <LoadingState message="Loading inventory" />;
  } else if (inventory.isError) {
    body = (
      <ErrorState
        title="Couldn't load inventory"
        message={inventory.error.message}
        onRetry={() => void inventory.refetch()}
      />
    );
  } else {
    const emptyMessage = filter.query
      ? `No products match "${filter.query}".`
      : filter.lowStockOnly
        ? 'Nothing is low or out of stock.'
        : 'No products in this category yet.';
    body = (
      <FlatList
        testID="inventory-list"
        data={visible}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ItemSeparatorComponent={Separator}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        initialNumToRender={12}
        ListHeaderComponent={
          <View style={styles.summary} accessibilityRole="toolbar" accessibilityLabel="Stock summary">
            <View style={[styles.tile, styles.tileNeutral]} accessible accessibilityLabel={`${counts.products} products`} testID="summary-products">
              <AppText style={styles.tileValue}>{counts.products}</AppText>
              <AppText style={styles.tileLabel}>products</AppText>
            </View>
            <SummaryToggle
              testID="summary-low"
              value={counts.low}
              label="low stock"
              tone="lowStock"
              selected={filter.lowStockOnly}
              onPress={toggleLowStock}
            />
            <SummaryToggle
              testID="summary-out"
              value={counts.out}
              label="out of stock"
              tone="outOfStock"
              selected={filter.lowStockOnly}
              onPress={toggleLowStock}
            />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <AppText color="textMuted" style={styles.emptyText} testID="empty-state">
              {emptyMessage}
            </AppText>
            {hasFilters ? (
              <SecondaryButton label="Clear filters" icon="close" onPress={() => setFilter(EMPTY_FILTER)} />
            ) : null}
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={inventory.isRefetching}
            onRefresh={() => void inventory.refetch()}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      />
    );
  }

  return (
    <Screen testID="inventory-screen">
      <ScreenTitle eyebrow="Stock on hand" title="Inventory" />
      <View style={styles.searchRow}>
        <SearchBar
          testID="inventory-search"
          value={filter.query}
          onChangeText={(query) => setFilter((f) => ({ ...f, query }))}
          placeholder="Product, SKU or barcode"
          accessibilityLabel="Search inventory by product, SKU or barcode"
        />
        <Pressable
          testID="inventory-scan"
          onPress={() => router.push('/inventory/scan')}
          accessibilityRole="button"
          accessibilityLabel="Scan a barcode"
          style={({ pressed }) => [styles.scanButton, pressed && styles.pressed]}
        >
          <Ionicons name="scan-outline" size={22} color={colors.textOnDark} />
        </Pressable>
      </View>
      <View style={styles.chips}>
        <FilterChips
          options={CATEGORY_OPTIONS}
          selected={filter.category}
          onChange={(category) => setFilter((f) => ({ ...f, category }))}
          accessibilityLabel="Filter by category"
        />
      </View>
      {body}
    </Screen>
  );
}

interface SummaryToggleProps {
  testID: string;
  value: number;
  label: string;
  tone: 'lowStock' | 'outOfStock';
  selected: boolean;
  onPress: () => void;
}

/** Tinted count tile. Pressing it narrows the list to products that need restocking. */
function SummaryToggle({ testID, value, label, tone, selected, onPress }: SummaryToggleProps) {
  const palette = statusPalette[tone];
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${value} ${label}`}
      accessibilityHint={selected ? 'Shows all products again' : 'Shows only products that need restocking'}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: palette.background },
        selected && { borderColor: palette.text },
        pressed && styles.pressed,
      ]}
    >
      <AppText style={[styles.tileValue, { color: palette.text }]}>{value}</AppText>
      <AppText style={[styles.tileLabel, { color: palette.text }]}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  searchRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.xl, paddingBottom: 14 },
  scanButton: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.inverse,
  },
  pressed: { opacity: 0.85 },
  chips: { paddingBottom: spacing.sm },
  listContent: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.xs, paddingBottom: spacing.xl },
  summary: { flexDirection: 'row', gap: spacing.sm, marginBottom: 10 },
  tile: { flex: 1, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: 'transparent' },
  tileNeutral: { backgroundColor: colors.surface, borderColor: colors.border },
  tileValue: { fontFamily: fontFamily.semibold, fontSize: 20, lineHeight: 26, color: colors.text },
  tileLabel: { fontFamily: fontFamily.regular, fontSize: 11, lineHeight: 14, color: colors.textMuted, marginTop: 2 },
  separator: { height: 10 },
  empty: { alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.xl },
  emptyText: { textAlign: 'center' },
});
