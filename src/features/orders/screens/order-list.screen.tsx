import { type FC, useCallback, useMemo, useState } from "react";
import {
  FlatList,
  type ListRenderItem,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";

import { useNow } from "@/hooks/use-now";

import { useRosterStore } from "@/features/roster/store/roster.store";

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
import { overdueOrders, sortForPicking } from "../domain/schedule";
import { useEnsureOrdersLoaded } from "../hooks/use-ensure-orders-loaded";
import { useOrdersStore } from "../store/orders.store";

export type OrderFilter = "ALL" | Exclude<OrderStatus, "CANCELLED">;

const FILTERS: Array<{
  emptyLabel: string;
  label: string;
  value: OrderFilter;
}> = [
  { value: "ALL", label: "All", emptyLabel: "No Click & Collect orders yet." },
  { value: "NEW", label: "New", emptyLabel: "No new orders." },
  { value: "PICKING", label: "Picking", emptyLabel: "Nothing being picked." },
  {
    value: "READY",
    label: "Ready",
    emptyLabel: "No orders ready for collection.",
  },
  {
    value: "COLLECTED",
    label: "Collected",
    emptyLabel: "No collected orders.",
  },
];

export function filterOrders(
  orders: Array<Order>,
  filter: OrderFilter,
): Array<Order> {
  return filter === "ALL"
    ? orders
    : orders.filter((order) => order.status === filter);
}

/** Matches order number, customer initials or assignee name. */
export function searchOrders(
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

const keyExtractor = (order: Order) => order.id;
const Separator = () => <View style={styles.separator} />;

export const OrderListScreen: FC<{ now?: Date }> = ({ now: fixedNow }) => {
  const router = useRouter();
  const loadStatus = useEnsureOrdersLoaded();
  const orders = useOrdersStore((s) => s.orders);
  const loadError = useOrdersStore((s) => s.loadError);
  const isRefreshing = useOrdersStore((s) => s.isRefreshing);
  const loadOrders = useOrdersStore((s) => s.loadOrders);
  const refreshOrders = useOrdersStore((s) => s.refreshOrders);
  const employees = useRosterStore((s) => s.employees);

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

  const sorted = useMemo(() => sortForPicking(orders, now), [orders, now]);
  const overdueCount = useMemo(
    () => overdueOrders(orders, now).length,
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
        onPress={openOrder}
      />
    ),
    [nameOf, now, openOrder],
  );

  const hasData = orders.length > 0;
  let body;
  if (!hasData && (loadStatus === "idle" || loadStatus === "loading")) {
    body = <LoadingState message="Loading Click & Collect orders" />;
  } else if (!hasData && loadStatus === "error") {
    body = (
      <ErrorState
        message={loadError ?? "Check your connection and try again."}
        title="Couldn't load orders"
        onRetry={() => void loadOrders()}
      />
    );
  } else {
    const emptyLabel = query
      ? `No orders match "${query}".`
      : (FILTERS.find((f) => f.value === filter)?.emptyLabel ?? "No orders.");
    body = (
      <FlatList
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={
          <AppText color="textMuted" style={styles.empty} testID="empty-state">
            {emptyLabel}
          </AppText>
        }
        ListHeaderComponent={
          loadError ? (
            <View style={styles.banner}>
              <InlineBanner
                message={`Refresh failed: ${loadError}`}
                tone="error"
              />
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
        data={visible}
        keyExtractor={keyExtractor}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            colors={[colors.accent]}
            refreshing={isRefreshing}
            tintColor={colors.accent}
            onRefresh={() => void refreshOrders()}
          />
        }
        renderItem={renderItem}
        testID="order-list"
      />
    );
  }

  return (
    <Screen testID="order-list-screen">
      <ScreenTitle
        eyebrow="Click & Collect"
        right={
          <IconButton
            accessibilityLabel={searchOpen ? "Close search" : "Search orders"}
            icon={searchOpen ? "close" : "search"}
            testID="toggle-search"
            onPress={() => {
              if (searchOpen) {
                setQuery("");
              }
              setSearchOpen((open) => !open);
            }}
          />
        }
        title="Orders"
      />
      <View style={styles.controls}>
        {searchOpen ? (
          <SearchBar
            accessibilityLabel="Search orders by number, customer initials or team member"
            placeholder="Order number, initials or team member"
            testID="order-search"
            value={query}
            onChangeText={setQuery}
          />
        ) : null}
        {overdueCount > 0 ? (
          <View
            accessible
            accessibilityLabel={`${overdueCount} ${overdueCount === 1 ? "order is" : "orders are"} overdue and shown first`}
            accessibilityRole="alert"
            style={styles.overdue}
            testID="overdue-banner"
          >
            <Ionicons
              color={statusPalette.overdue.text}
              name="time-outline"
              size={18}
            />
            <AppText style={styles.overdueText}>
              {overdueCount} overdue · shown first
            </AppText>
          </View>
        ) : null}
      </View>
      <View style={styles.filters}>
        <FilterChips
          accessibilityLabel="Filter orders by status"
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
