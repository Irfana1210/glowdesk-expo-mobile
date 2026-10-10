import { type FC, useMemo, useRef } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";

import { useRouter } from "expo-router";

import { FormatUtils } from "@/utils/format-utils";

import { useNow } from "@/hooks/use-now";

import { useInventory } from "@/features/inventory/hooks/use-inventory";
import { ScheduleUtils } from "@/features/orders/domain/schedule";
import { useEnsureOrdersLoaded } from "@/features/orders/hooks/use-ensure-orders-loaded";
import { useOrdersStore } from "@/features/orders/store/orders.store";
import { CoverUtils } from "@/features/roster/domain/cover";
import { DateUtils } from "@/features/roster/domain/dates";
import { ShiftUtils } from "@/features/roster/domain/shifts";
import { useRosterStore } from "@/features/roster/store/roster.store";

import { Screen } from "@/components/layout/screen";
import { AppText } from "@/components/ui/app-text";
import { AttentionItem } from "@/components/ui/attention-item";
import { ErrorState } from "@/components/ui/error-state";
import { IconButton } from "@/components/ui/icon-button";
import { KPICard } from "@/components/ui/kpi-card";
import { LoadingState } from "@/components/ui/loading-state";
import { ScreenTitle } from "@/components/ui/screen-title";
import { ShiftCard } from "@/components/ui/shift-card";

import { DEMO_STORE_ID, DEMO_STORE_SHORT_NAME } from "@/mocks/store";
import { DEMO_USER } from "@/mocks/user";
import { colors, fontFamily, radius, spacing } from "@/theme";

import { SalesChart } from "../components/sales-chart";
import { AttentionUtils } from "../domain/attention";
import { type DashboardKpis, KpiUtils } from "../domain/kpis";
import { ShiftCardUtils } from "../domain/shift-card";
import { useStoreSalesSummary } from "../hooks/use-store-sales-summary";

const NOT_AVAILABLE = "not available";

export const DashboardScreen: FC<{ now?: Date }> = ({ now: fixedNow }) => {
  const router = useRouter();
  const liveNow = useNow();
  const now = fixedNow ?? liveNow;
  const scrollRef = useRef<ScrollView>(null);
  const attentionY = useRef(0);

  const salesQuery = useStoreSalesSummary(DEMO_STORE_ID);
  const inventoryQuery = useInventory();
  const kpis = useMemo(
    () =>
      salesQuery.data ? KpiUtils.calculateDashboardKpis(salesQuery.data) : null,
    [salesQuery.data],
  );

  const ordersLoadStatus = useEnsureOrdersLoaded();
  const orders = useOrdersStore((s) => s.orders);
  const refreshOrders = useOrdersStore((s) => s.refreshOrders);
  const ordersReady = ordersLoadStatus === "ready" || orders.length > 0;

  const shifts = useRosterStore((s) => s.shifts);
  const employees = useRosterStore((s) => s.employees);

  const today = useMemo(
    () => ShiftUtils.shiftsOnDay(shifts, now),
    [shifts, now],
  );
  const upcomingBreak = useMemo(
    () => CoverUtils.nextBreak(today, now),
    [today, now],
  );
  const shiftCard = useMemo(
    () =>
      ShiftCardUtils.shiftCardModel({
        myShift: today.find((s) => s.employeeId === DEMO_USER.employeeId),
        now,
        staffOnFloor: CoverUtils.staffOnFloor(today, now).length,
        nextBreakAt: upcomingBreak?.startsAt ?? null,
        ordersToAssign: ScheduleUtils.unassignedActiveCount(orders),
      }),
    [today, now, upcomingBreak, orders],
  );
  const attention = useMemo(
    () =>
      AttentionUtils.buildAttention({
        orders,
        upcomingBreak,
        breakEmployeeName: employees.find(
          (e) => e.id === upcomingBreak?.shift.employeeId,
        )?.name,
        inventory: inventoryQuery.data,
        now,
      }),
    [orders, upcomingBreak, employees, inventoryQuery.data, now],
  );
  const orderCounts = useMemo(
    () => ({
      pending: orders.filter(
        (o) => o.status === "NEW" || o.status === "PICKING",
      ).length,
      ready: orders.filter((o) => o.status === "READY").length,
    }),
    [orders],
  );

  const onRefresh = () => {
    void salesQuery.refetch();
    void inventoryQuery.refetch();
    void refreshOrders();
  };

  return (
    <Screen testID="dashboard-screen">
      <ScrollView
        contentContainerStyle={styles.content}
        ref={scrollRef}
        refreshControl={
          <RefreshControl
            colors={[colors.accent]}
            refreshing={salesQuery.isRefetching}
            tintColor={colors.accent}
            onRefresh={onRefresh}
          />
        }
      >
        <ScreenTitle
          eyebrow={`${FormatUtils.formatShortDate(now)} · ${DEMO_STORE_SHORT_NAME}`}
          right={
            <>
              <IconButton
                accessibilityLabel={`Notifications, ${attention.length} ${attention.length === 1 ? "item needs" : "items need"} attention`}
                badge={attention.length}
                icon="notifications-outline"
                testID="notifications"
                onPress={() =>
                  scrollRef.current?.scrollTo({
                    y: attentionY.current,
                    animated: true,
                  })
                }
              />
              <IconButton
                accessibilityLabel={`Profile and settings, ${DEMO_USER.firstName}`}
                icon="person-outline"
                testID="profile"
                text={DEMO_USER.firstName.slice(0, 2).toUpperCase()}
                onPress={() => router.push("/more/settings")}
              />
            </>
          }
          subtitle={DEMO_USER.role}
          title={`Hi, ${DEMO_USER.firstName}`}
        />

        <View style={styles.body}>
          <ShiftCard testID="shift-card" {...shiftCard} />

          <View
            style={styles.section}
            onLayout={(event) => {
              attentionY.current = event.nativeEvent.layout.y;
            }}
          >
            <View style={styles.sectionHeader}>
              <AppText accessibilityRole="header" variant="sectionTitle">
                Needs attention
              </AppText>
              <AppText color="textMuted" style={styles.small}>
                {attention.length === 1
                  ? "1 item"
                  : `${attention.length} items`}
              </AppText>
            </View>
            {attention.length === 0 ? (
              <AppText color="textMuted" testID="attention-empty">
                Nothing needs attention right now.
              </AppText>
            ) : (
              attention.map((item) => (
                <AttentionItem
                  icon={item.icon}
                  key={item.key}
                  subtitle={item.subtitle}
                  testID={`attention-${item.key}`}
                  title={item.title}
                  tone={item.tone}
                  onPress={() => router.navigate(item.href)}
                />
              ))
            )}
          </View>

          <View style={styles.section}>
            <AppText accessibilityRole="header" variant="sectionTitle">
              Today so far
            </AppText>
            {salesQuery.isPending ? (
              <View style={[styles.card, styles.placeholder]}>
                <LoadingState message="Loading today's sales" />
              </View>
            ) : salesQuery.isError ? (
              <View style={styles.card}>
                <ErrorState
                  message={salesQuery.error.message}
                  title="Couldn't load sales"
                  onRetry={() => void salesQuery.refetch()}
                />
              </View>
            ) : kpis ? (
              <SalesHero kpis={kpis} />
            ) : null}

            <View style={styles.grid}>
              {kpis ? (
                <>
                  <KPICard
                    label="Transactions"
                    style={styles.gridItem}
                    supporting={`Since ${FormatUtils.formatClockTime(DateUtils.atTime(now, ShiftUtils.STORE_TRADING_HOURS.open) ?? now)}`}
                    testID="kpi-transactions"
                    value={kpis.transactions.toLocaleString("en-AU")}
                  />
                  <KPICard
                    accessibilityLabel={`Average transaction value, ${
                      kpis.averageTransactionValue === null
                        ? NOT_AVAILABLE
                        : FormatUtils.formatCurrency(
                            kpis.averageTransactionValue,
                            {
                              cents: true,
                            },
                          )
                    }`}
                    label="Avg transaction"
                    style={styles.gridItem}
                    supporting="Sales ÷ transactions"
                    testID="kpi-atv"
                    value={
                      kpis.averageTransactionValue === null
                        ? "—"
                        : FormatUtils.formatCurrency(
                            kpis.averageTransactionValue,
                            {
                              cents: true,
                            },
                          )
                    }
                  />
                  <KPICard
                    accessibilityLabel={`Labour, ${
                      kpis.labourPercent === null
                        ? NOT_AVAILABLE
                        : `${FormatUtils.formatPercent(kpis.labourPercent, 1)} of sales`
                    }, ${FormatUtils.formatCurrency(kpis.labourSpend)} estimated spend`}
                    label="Labour"
                    style={styles.gridItem}
                    supporting={`${FormatUtils.formatCurrency(kpis.labourSpend)} of sales`}
                    testID="kpi-labour"
                    value={FormatUtils.formatPercent(kpis.labourPercent, 1)}
                  />
                </>
              ) : null}
              <KPICard
                accessibilityHint="Opens Click & Collect orders"
                label="Click & Collect"
                style={styles.gridItem}
                supporting={
                  ordersReady
                    ? `${orderCounts.ready} ready to collect`
                    : "Loading orders"
                }
                testID="kpi-orders"
                value={ordersReady ? String(orderCounts.pending) : "—"}
                onPress={() => router.navigate("/orders")}
              />
            </View>
          </View>

          {salesQuery.data ? (
            <View style={styles.card}>
              <SalesChart data={salesQuery.data.hourly} />
            </View>
          ) : null}

          <AppText
            color="textMuted"
            style={styles.footnote}
            variant="supporting"
          >
            Demo mode with fictional data. Labour is a flat-rate estimate, not a
            payroll calculation.
          </AppText>
        </View>
      </ScrollView>
    </Screen>
  );
};

function SalesHero({ kpis }: { kpis: DashboardKpis }) {
  const achievement = kpis.achievementPercent;
  const remaining =
    achievement === null
      ? "No sales target set for today"
      : kpis.remainingToTarget === 0
        ? `Target ${FormatUtils.formatCurrency(kpis.target)} reached`
        : `${FormatUtils.formatCurrency(kpis.remainingToTarget)} to go · target ${FormatUtils.formatCurrency(kpis.target)}`;
  const percent =
    achievement === null ? 0 : Math.min(100, Math.max(0, achievement));

  return (
    <View style={styles.card} testID="sales-summary">
      <AppText color="textMuted" style={styles.small}>
        Sales
      </AppText>
      <View style={styles.heroRow}>
        <AppText
          accessibilityLabel={`Today's sales ${FormatUtils.formatCurrency(kpis.sales)}`}
          style={styles.heroValue}
          testID="sales-total"
          variant="hero"
        >
          {FormatUtils.formatCurrency(kpis.sales)}
        </AppText>
        <AppText style={styles.heroPercent}>
          {FormatUtils.formatPercent(achievement, 1)}
        </AppText>
      </View>
      <View
        accessible
        accessibilityLabel={
          achievement === null
            ? `Sales target achievement ${NOT_AVAILABLE}`
            : `Sales target achievement ${FormatUtils.formatPercent(achievement, 1)}. ${remaining}`
        }
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(percent) }}
        style={styles.track}
      >
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>
      <AppText color="textMuted" variant="supporting">
        {remaining}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  body: { paddingHorizontal: spacing.xl, gap: spacing.xxl },
  section: { gap: 10 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  small: { fontSize: 13 },
  card: {
    gap: 10,
    padding: 18,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  placeholder: { minHeight: 150 },
  heroRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  heroValue: { fontSize: 44, lineHeight: 50 },
  heroPercent: {
    fontFamily: fontFamily.semibold,
    fontSize: 14,
    color: colors.successDark,
  },
  track: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.track,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.success,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  gridItem: { flexGrow: 1, flexBasis: "45%" },
  footnote: { textAlign: "center" },
});
