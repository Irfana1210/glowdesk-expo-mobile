import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View, type ListRenderItem } from 'react-native';

import { AppHeader } from '@/components/layout/AppHeader';
import { Screen } from '@/components/layout/Screen';
import {
  AppText,
  EmptyState,
  ErrorState,
  FilterChips,
  LoadingState,
  SecondaryButton,
  SearchBar,
  type FilterOption,
} from '@/components/ui';
import { pluralise } from '@/lib/format';
import { colors, radius, spacing, touchTarget } from '@/theme';
import { CATEGORY_LABELS, PRODUCT_CATEGORIES, type ProductCategory } from '@/types/product';

import { ProductCard } from '../components/ProductCard';
import { EMPTY_FILTER, countNeedingReplenishment, filterInventory, type InventoryFilter } from '../domain/stock';
import { useInventory } from '../hooks/useInventory';
import type { InventoryItem } from '../types';

type CategoryFilter = ProductCategory | 'ALL';

const keyExtractor = (item: InventoryItem) => item.product.id;
const Separator = () => <View style={styles.separator} />;

export function InventoryScreen() {
  const router = useRouter();
  const inventory = useInventory();
  const items = useMemo(() => inventory.data ?? [], [inventory.data]);
  const [filter, setFilter] = useState<InventoryFilter>(EMPTY_FILTER);

  const lowStockCount = useMemo(() => countNeedingReplenishment(items), [items]);
  const visible = useMemo(() => filterInventory(items, filter), [items, filter]);
  const categoryOptions = useMemo<FilterOption<CategoryFilter>[]>(
    () => [
      { value: 'ALL', label: 'All', count: items.length },
      ...PRODUCT_CATEGORIES.map((category) => ({
        value: category,
        label: CATEGORY_LABELS[category],
        count: items.filter((i) => i.product.category === category).length,
      })),
    ],
    [items],
  );

  const openProduct = useCallback(
    (productId: string) => router.push({ pathname: '/inventory/[id]', params: { id: productId } }),
    [router],
  );
  const renderItem = useCallback<ListRenderItem<InventoryItem>>(
    ({ item }) => <ProductCard item={item} onPress={openProduct} />,
    [openProduct],
  );

  const hasFilters = filter.query.length > 0 || filter.category !== 'ALL' || filter.lowStockOnly;
  const subtitle = inventory.data
    ? `${pluralise(items.length, 'product')} · ${lowStockCount} need restocking`
    : 'RetailOS Melbourne Central';

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
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title="No products match"
            message={hasFilters ? 'Try a different search or clear the filters.' : 'This store has no products yet.'}
            action={
              hasFilters ? (
                <SecondaryButton label="Clear filters" icon="close" onPress={() => setFilter(EMPTY_FILTER)} />
              ) : undefined
            }
          />
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
      <AppHeader title="Inventory" subtitle={subtitle} />
      <View style={styles.controls}>
        <View style={styles.searchRow}>
          <SearchBar
            testID="inventory-search"
            value={filter.query}
            onChangeText={(query) => setFilter((f) => ({ ...f, query }))}
            placeholder="Search products, SKU or barcode"
            accessibilityLabel="Search products by name, brand, SKU or barcode"
          />
          <Pressable
            testID="inventory-scan"
            onPress={() => router.push('/inventory/scan')}
            accessibilityRole="button"
            accessibilityLabel="Scan a product barcode"
            style={({ pressed }) => [styles.scanButton, pressed && styles.pressed]}
          >
            <Ionicons name="scan-outline" size={22} color={colors.textOnAccent} />
          </Pressable>
        </View>
      </View>
      <FilterChips
        options={categoryOptions}
        selected={filter.category}
        onChange={(category) => setFilter((f) => ({ ...f, category }))}
        accessibilityLabel="Filter products by category"
      />
      <View style={styles.toggleRow}>
        <Pressable
          testID="low-stock-toggle"
          onPress={() => setFilter((f) => ({ ...f, lowStockOnly: !f.lowStockOnly }))}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: filter.lowStockOnly }}
          accessibilityLabel={`Show only low stock, ${pluralise(lowStockCount, 'item')}`}
          hitSlop={{ top: 6, bottom: 6 }}
          style={[styles.toggle, filter.lowStockOnly && styles.toggleOn]}
        >
          <Ionicons
            name={filter.lowStockOnly ? 'checkbox' : 'square-outline'}
            size={18}
            color={filter.lowStockOnly ? colors.accent : colors.textMuted}
          />
          <AppText variant={filter.lowStockOnly ? 'bodyStrong' : 'body'}>Low stock only ({lowStockCount})</AppText>
        </Pressable>
        {inventory.data ? (
          <AppText variant="supporting" color="textMuted" accessibilityLiveRegion="polite">
            {pluralise(visible.length, 'result')}
          </AppText>
        ) : null}
      </View>
      {body}
    </Screen>
  );
}

const styles = StyleSheet.create({
  controls: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  scanButton: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  pressed: { opacity: 0.85 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  toggleOn: { borderColor: colors.accent, backgroundColor: colors.infoSoft },
  listContent: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  separator: { height: spacing.sm },
});
