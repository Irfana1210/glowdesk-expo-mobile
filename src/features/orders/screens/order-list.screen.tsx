import { type FC, useCallback, useMemo, useState } from "react";
import {
  FlatList,
  type ListRenderItem,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";
import { onlineManager } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import { LOCALE } from "@/constants/locale";

import { errorMessage } from "@/utils/handle-api-error";

import { useNow } from "@/hooks/use-now";
import { useTabBarInset } from "@/hooks/use-tab-bar-inset";

import { useEmployees } from "@/features/employees/hooks/use-employees";
import { type Employee } from "@/features/employees/types";

import { Screen } from "@/components/layout/screen";
import { AppText } from "@/components/ui/app-text";
import { ErrorState } from "@/components/ui/error-state";
import { FilterChips, type FilterOption } from "@/components/ui/filter-chips";
import { IconButton } from "@/components/ui/icon-button";
import { InlineBanner } from "@/components/ui/inline-banner";
import { LoadingState } from "@/components/ui/loading-state";
import { ScreenTitle } from "@/components/ui/screen-title";
import { SearchBar } from "@/components/ui/search-bar";

import { colors, fontFamily, radius, spacing, statusPalette } from "@/theme";
import { type Order, type OrderStatus } from "@/types/order";

import { OrderListCard } from "../components/order-list-card";
import { ScheduleUtils } from "../domain/schedule";
import { useOrders } from "../hooks/use-orders";
import { usePendingOrderIds } from "../hooks/use-pending-order-ids";

const L = LOCALE.orders.list;

type OrderFilter = "ALL" | Exclude<OrderStatus, "CANCELLED">;

const FILTERS: Array<{
  emptyLabel: string;
  label: string;
  value: OrderFilter;
}> = [
  { value: "ALL", label: L.filters.all, emptyLabel: L.empty.all },
  { value: "NEW", label: L.filters.new, emptyLabel: L.empty.new },
  { value: "PICKING", label: L.filters.picking, emptyLabel: L.empty.picking },
  { value: "READY", label: L.filters.ready, emptyLabel: L.empty.ready },
  {
    value: "COLLECTED",
    label: L.filters.collected,
    emptyLabel: L.empty.collected,
  },
];

function filterOrders(orders: Array<Order>, filter: OrderFilter): Array<Order> {
  return filter === "ALL"
    ? orders
    : orders.filter((order) => order.status === filter);
}

/** Matches order number, customer initials or assignee name. */
function searchOrders(
  orders: Array<Order>,
  query: string,
  nameOf: (id?: string) => string | undefined,
): Array<Order> {
  const q = query.trim().toLowerCase().replace(/\./g, "");
  if (!q) {
    return orders;
  }
  return orders.filter((o) =>
    [
      o.id,
      o.customerInitials.replace(/\./g, ""),
      nameOf(o.assigneeId) ?? "",
    ].some((field) => field.toLowerCase().replace(/\./g, "").includes(q)),
  );
}

const NO_ORDERS: Array<Order> = [];
const NO_EMPLOYEES: Array<Employee> = [];
const keyExtractor = (order: Order) => order.id;
const Separator = () => <View style={styles.separator} />;

export const OrderListScreen: FC<{ now?: Date }> = ({ now: fixedNow }) => {
  const router = useRouter();
  const tabBarInset = useTabBarInset();
  const ordersQuery = useOrders();
  const orders = ordersQuery.data ?? NO_ORDERS;
  const loadError = ordersQuery.error ? errorMessage(ordersQuery.error) : null;
  const employees = useEmployees().data ?? NO_EMPLOYEES;
  const pendingIds = usePendingOrderIds();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pull to refresh does nothing offline: the saved list is already showing, and the banner
  // explains why it cannot update.
  const refresh = async () => {
    if (!onlineManager.isOnline()) {
      return;
    }
    setIsRefreshing(true);
    await ordersQuery.refetch();
    setIsRefreshing(false);
  };

  const [filter, setFilter] = useState<OrderFilter>("ALL");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Overdue status depends on the clock, refreshed every 30 seconds. Tests pass a fixed time.
  const liveNow = useNow();
  const now = fixedNow ?? liveNow;
  const names = useMemo(
    () => new Map(employees.map((e) => [e.id, e.name])),
    [employees],
  );
  const nameOf = useCallback(
    (id?: string) => (id ? names.get(id) : undefined),
    [names],
  );

  const sorted = useMemo(
    () => ScheduleUtils.sortForPicking(orders, now),
    [orders, now],
  );
  const overdueCount = useMemo(
    () => ScheduleUtils.overdueOrders(orders, now).length,
    [orders, now],
  );
  const filterOptions = useMemo<Array<FilterOption<OrderFilter>>>(
    () =>
      FILTERS.map((f) => ({
        value: f.value,
        label: f.label,
        count: filterOrders(orders, f.value).length,
      })),
    [orders],
  );
  const visible = useMemo(
    () => searchOrders(filterOrders(sorted, filter), query, nameOf),
    [sorted, filter, query, nameOf],
  );

  const openOrder = useCallback(
    (orderId: string) =>
      router.push({ pathname: "/orders/[id]", params: { id: orderId } }),
    [router],
  );
  const renderItem = useCallback<ListRenderItem<Order>>(
    ({ item }) => (
      <OrderListCard
        assigneeName={nameOf(item.assigneeId)}
        now={now}
        order={item}
        pendingSync={pendingIds.includes(item.id)}
        onPress={openOrder}
      />
    ),
    [nameOf, now, openOrder, pendingIds],
  );

  const hasData = orders.length > 0;
  let body;
  if (!hasData && ordersQuery.isPending) {
    body = <LoadingState message={L.loading} />;
  } else if (!hasData && ordersQuery.isError) {
    body = (
      <ErrorState
        message={loadError ?? L.loadErrorMessage}
        title={L.loadErrorTitle}
        onRetry={() => void ordersQuery.refetch()}
      />
    );
  } else {
    const emptyLabel = query
      ? L.empty.noMatch(query)
      : (FILTERS.find((f) => f.value === filter)?.emptyLabel ??
        L.empty.fallback);
    body = (
      <FlatList
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={
          <AppText
            color="textMuted"
            style={styles.empty}
            testID="ORDER_LIST.EMPTY_STATE"
          >
            {emptyLabel}
          </AppText>
        }
        ListHeaderComponent={
          loadError ? (
            <View style={styles.banner}>
              <InlineBanner message={L.refreshFailed(loadError)} tone="error" />
            </View>
          ) : null
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarInset },
        ]}
        data={visible}
        keyExtractor={keyExtractor}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            colors={[colors.accent]}
            refreshing={isRefreshing}
            tintColor={colors.accent}
            onRefresh={() => void refresh()}
          />
        }
        renderItem={renderItem}
        testID="ORDER_LIST"
      />
    );
  }

  return (
    <Screen testID="ORDER_LIST.SCREEN">
      <ScreenTitle
        eyebrow={L.eyebrow}
        right={
          <IconButton
            accessibilityLabel={searchOpen ? L.closeSearch : L.openSearch}
            icon={searchOpen ? "close" : "search"}
            testID="ORDER_LIST.TOGGLE_SEARCH"
            onPress={() => {
              if (searchOpen) {
                setQuery("");
              }
              setSearchOpen((open) => !open);
            }}
          />
        }
        title={L.title}
      />
      <View style={styles.controls}>
        {searchOpen ? (
          <SearchBar
            accessibilityLabel={L.searchAccessibilityLabel}
            placeholder={L.searchPlaceholder}
            testID="ORDER_LIST.SEARCH"
            value={query}
            onChangeText={setQuery}
          />
        ) : null}
        {overdueCount > 0 ? (
          <View
            accessible
            accessibilityLabel={L.overdueBannerAccessibilityLabel(overdueCount)}
            accessibilityRole="alert"
            style={styles.overdue}
            testID="ORDER_LIST.OVERDUE_BANNER"
          >
            <Ionicons
              color={statusPalette.overdue.text}
              name="time-outline"
              size={18}
            />
            <AppText style={styles.overdueText}>
              {L.overdueBanner(overdueCount)}
            </AppText>
          </View>
        ) : null}
      </View>
      <View style={styles.filters}>
        <FilterChips
          accessibilityLabel={L.filterAccessibilityLabel}
          options={filterOptions}
          selected={filter}
          onChange={setFilter}
        />
      </View>
      {body}
    </Screen>
  );
};

const styles = StyleSheet.create({
  controls: { paddingHorizontal: spacing.xl, gap: spacing.md },
  overdue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: statusPalette.overdue.background,
  },
  overdueText: {
    fontFamily: fontFamily.semibold,
    fontSize: 13,
    lineHeight: 18,
    color: statusPalette.overdue.text,
  },
  filters: { paddingTop: spacing.md, paddingBottom: spacing.sm },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
  },
  separator: { height: 10 },
  banner: { marginBottom: spacing.md },
  empty: { textAlign: "center", marginVertical: spacing.xl },
});
