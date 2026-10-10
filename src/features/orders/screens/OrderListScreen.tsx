import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View, type ListRenderItem } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import {
  AppText,
  ErrorState,
  FilterChips,
  IconButton,
  InlineBanner,
  LoadingState,
  ScreenTitle,
  SearchBar,
  type FilterOption,
} from '@/components/ui';
import { useRosterStore } from '@/features/roster/store/useRosterStore';
import { useNow } from '@/hooks/useNow';
import { colors, fontFamily, radius, spacing, statusPalette } from '@/theme';
import type { Order, OrderStatus } from '@/types/order';

import { OrderListCard } from '../components/OrderListCard';
import { overdueOrders, sortForPicking } from '../domain/schedule';
import { useEnsureOrdersLoaded } from '../hooks/useEnsureOrdersLoaded';
import { useOrdersStore } from '../store/useOrdersStore';

export type OrderFilter = 'ALL' | Exclude<OrderStatus, 'CANCELLED'>;

const FILTERS: { value: OrderFilter; label: string; emptyLabel: string }[] = [
  { value: 'ALL', label: 'All', emptyLabel: 'No Click & Collect orders yet.' },
  { value: 'NEW', label: 'New', emptyLabel: 'No new orders.' },
  { value: 'PICKING', label: 'Picking', emptyLabel: 'Nothing being picked.' },
  { value: 'READY', label: 'Ready', emptyLabel: 'No orders ready for collection.' },
  { value: 'COLLECTED', label: 'Collected', emptyLabel: 'No collected orders.' },
];

export function filterOrders(orders: Order[], filter: OrderFilter): Order[] {
  return filter === 'ALL' ? orders : orders.filter((order) => order.status === filter);
}

/** Matches order number, customer initials or assignee name. */
export function searchOrders(orders: Order[], query: string, nameOf: (id?: string) => string | undefined): Order[] {
  const q = query.trim().toLowerCase().replace(/\./g, '');
  if (!q) return orders;
  return orders.filter((o) =>
    [o.id, o.customerInitials.replace(/\./g, ''), nameOf(o.assigneeId) ?? ''].some((field) =>
      field.toLowerCase().replace(/\./g, '').includes(q),
    ),
  );
}

const keyExtractor = (order: Order) => order.id;
const Separator = () => <View style={styles.separator} />;

export function OrderListScreen({ now: fixedNow }: { now?: Date } = {}) {
  const router = useRouter();
  const loadStatus = useEnsureOrdersLoaded();
  const orders = useOrdersStore((s) => s.orders);
  const loadError = useOrdersStore((s) => s.loadError);
  const isRefreshing = useOrdersStore((s) => s.isRefreshing);
  const loadOrders = useOrdersStore((s) => s.loadOrders);
  const refreshOrders = useOrdersStore((s) => s.refreshOrders);
  const employees = useRosterStore((s) => s.employees);

  const [filter, setFilter] = useState<OrderFilter>('ALL');
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  // Overdue status depends on the clock, refreshed every 30 seconds. Tests pass a fixed time.
  const liveNow = useNow();
  const now = fixedNow ?? liveNow;
  const names = useMemo(() => new Map(employees.map((e) => [e.id, e.name])), [employees]);
  const nameOf = useCallback((id?: string) => (id ? names.get(id) : undefined), [names]);

  const sorted = useMemo(() => sortForPicking(orders, now), [orders, now]);
  const overdueCount = useMemo(() => overdueOrders(orders, now).length, [orders, now]);
  const filterOptions = useMemo<FilterOption<OrderFilter>[]>(
    () => FILTERS.map((f) => ({ value: f.value, label: f.label, count: filterOrders(orders, f.value).length })),
    [orders],
  );
  const visible = useMemo(
    () => searchOrders(filterOrders(sorted, filter), query, nameOf),
    [sorted, filter, query, nameOf],
  );

  const openOrder = useCallback(
    (orderId: string) => router.push({ pathname: '/orders/[id]', params: { id: orderId } }),
    [router],
  );
  const renderItem = useCallback<ListRenderItem<Order>>(
    ({ item }) => <OrderListCard order={item} assigneeName={nameOf(item.assigneeId)} now={now} onPress={openOrder} />,
    [nameOf, now, openOrder],
  );

  const hasData = orders.length > 0;
  let body;
  if (!hasData && (loadStatus === 'idle' || loadStatus === 'loading')) {
    body = <LoadingState message="Loading Click & Collect orders" />;
  } else if (!hasData && loadStatus === 'error') {
    body = (
      <ErrorState
        title="Couldn't load orders"
        message={loadError ?? 'Check your connection and try again.'}
        onRetry={() => void loadOrders()}
      />
    );
  } else {
    const emptyLabel = query
      ? `No orders match "${query}".`
      : (FILTERS.find((f) => f.value === filter)?.emptyLabel ?? 'No orders.');
    body = (
      <FlatList
        testID="order-list"
        data={visible}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ItemSeparatorComponent={Separator}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          loadError ? (
            <View style={styles.banner}>
              <InlineBanner tone="error" message={`Refresh failed: ${loadError}`} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <AppText color="textMuted" style={styles.empty} testID="empty-state">
            {emptyLabel}
          </AppText>
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void refreshOrders()}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      />
    );
  }

  return (
    <Screen testID="order-list-screen">
      <ScreenTitle
        eyebrow="Click & Collect"
        title="Orders"
        right={
          <IconButton
            testID="toggle-search"
            icon={searchOpen ? 'close' : 'search'}
            accessibilityLabel={searchOpen ? 'Close search' : 'Search orders'}
            onPress={() => {
              if (searchOpen) setQuery('');
              setSearchOpen((open) => !open);
            }}
          />
        }
      />
      <View style={styles.controls}>
        {searchOpen ? (
          <SearchBar
            testID="order-search"
            value={query}
            onChangeText={setQuery}
            placeholder="Order number, initials or team member"
            accessibilityLabel="Search orders by number, customer initials or team member"
          />
        ) : null}
        {overdueCount > 0 ? (
          <View
            style={styles.overdue}
            testID="overdue-banner"
            accessible
            accessibilityRole="alert"
            accessibilityLabel={`${overdueCount} ${overdueCount === 1 ? 'order is' : 'orders are'} overdue and shown first`}
          >
            <Ionicons name="time-outline" size={18} color={statusPalette.overdue.text} />
            <AppText style={styles.overdueText}>{overdueCount} overdue · shown first</AppText>
          </View>
        ) : null}
      </View>
      <View style={styles.filters}>
        <FilterChips
          options={filterOptions}
          selected={filter}
          onChange={setFilter}
          accessibilityLabel="Filter orders by status"
        />
      </View>
      {body}
    </Screen>
  );
}

const styles = StyleSheet.create({
  controls: { paddingHorizontal: spacing.xl, gap: spacing.md },
  overdue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: statusPalette.overdue.background,
  },
  overdueText: { fontFamily: fontFamily.semibold, fontSize: 13, lineHeight: 18, color: statusPalette.overdue.text },
  filters: { paddingTop: spacing.md, paddingBottom: spacing.sm },
  listContent: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.xs, paddingBottom: spacing.xl },
  separator: { height: 10 },
  banner: { marginBottom: spacing.md },
  empty: { textAlign: 'center', marginVertical: spacing.xl },
});
