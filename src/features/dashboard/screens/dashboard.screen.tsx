import { type FC, useMemo, useRef, useState } from "react";
import {
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { useRouter } from "expo-router";

import { LOCALE } from "@/constants/locale";

import { FormatUtils } from "@/utils/format-utils";

import { useNow } from "@/hooks/use-now";
import { useTabBarInset } from "@/hooks/use-tab-bar-inset";

import { AuthUtils } from "@/features/auth/domain/auth";
import {
  selectSession,
  useSessionStore,
} from "@/features/auth/store/session.store";
import { useEmployees } from "@/features/employees/hooks/use-employees";
import { type Employee, ROLE_LABELS } from "@/features/employees/types";
import { useInventory } from "@/features/inventory/hooks/use-inventory";
import { ScheduleUtils } from "@/features/orders/domain/schedule";
import { useOrders } from "@/features/orders/hooks/use-orders";
import { CoverUtils } from "@/features/roster/domain/cover";
import { DateUtils } from "@/features/roster/domain/dates";
import { ShiftUtils } from "@/features/roster/domain/shifts";
import { useShifts } from "@/features/roster/hooks/use-shifts";
import { type Shift } from "@/features/roster/types";

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
import { colors, fontFamily, radius, spacing } from "@/theme";
import { type Order } from "@/types/order";

import { SalesChart } from "../components/sales-chart";
import { AttentionUtils } from "../domain/attention";
import { type DashboardKpis, KpiUtils } from "../domain/kpis";
import { ShiftCardUtils } from "../domain/shift-card";
import { useStoreSalesSummary } from "../hooks/use-store-sales-summary";

const L = LOCALE.dashboard.screen;
const NO_ORDERS: Array<Order> = [];
const NO_SHIFTS: Array<Shift> = [];
const NO_EMPLOYEES: Array<Employee> = [];
const A = LOCALE.dashboard.attention;
const T = LOCALE.dashboard.today;
const K = LOCALE.dashboard.kpis;
const H = LOCALE.dashboard.salesHero;

export const DashboardScreen: FC<{ now?: Date }> = ({ now: fixedNow }) => {
  const router = useRouter();
  const tabBarInset = useTabBarInset();
  const liveNow = useNow();
  const now = fixedNow ?? liveNow;
  const scrollRef = useRef<ScrollView>(null);
  // onLayout reports y relative to the parent, so the section's offset inside the
  // scroll content is the body's y plus the section's y within the body.
  const bodyY = useRef(0);
  const attentionY = useRef(0);
  // Flashes behind "Needs attention" after the bell scrolls to it, so the tap visibly lands.
  const [highlight] = useState(() => new Animated.Value(0));
  // The sales chart's open tooltip. Any touch on the screen closes it; a bar's own tap then
  // reopens it there, so tapping elsewhere or scrolling dismisses it.
  const [chartHour, setChartHour] = useState<number | null>(null);

  const showAttention = () => {
    scrollRef.current?.scrollTo({
      y: Math.max(0, bodyY.current + attentionY.current - spacing.md),
      animated: true,
    });
    highlight.setValue(0);
    Animated.sequence([
      Animated.timing(highlight, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(700),
      Animated.timing(highlight, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const salesQuery = useStoreSalesSummary(DEMO_STORE_ID);
  const inventoryQuery = useInventory();
  const kpis = useMemo(
    () =>
      salesQuery.data ? KpiUtils.calculateDashboardKpis(salesQuery.data) : null,
    [salesQuery.data],
  );

  const ordersQuery = useOrders();
  const orders = ordersQuery.data ?? NO_ORDERS;
  const ordersReady = ordersQuery.data !== undefined;

  const shiftsQuery = useShifts();
  const shifts = shiftsQuery.data ?? NO_SHIFTS;
  const employees = useEmployees().data ?? NO_EMPLOYEES;
  const session = useSessionStore(selectSession);
  const firstName = session ? AuthUtils.firstName(session.name) : "";

  const today = useMemo(
    () => ShiftUtils.shiftsOnDay(shifts, now),
    [shifts, now],
  );
  const upcomingBreak = useMemo(
    () => CoverUtils.nextBreak(today, now),
    [today, now],
  );
  const breakNeedingCover = useMemo(
    () => CoverUtils.nextBreakNeedingCover(today, now),
    [today, now],
  );
  const shiftCard = useMemo(
    () =>
      ShiftCardUtils.shiftCardModel({
        myShift: today.find((s) => s.employeeId === session?.employeeId),
        now,
        staffOnFloor: CoverUtils.staffOnFloor(today, now).length,
        nextBreakAt: upcomingBreak?.startsAt ?? null,
        nextBreakOf: !upcomingBreak
          ? undefined
          : upcomingBreak.shift.employeeId === session?.employeeId
            ? "you"
            : {
                firstName:
                  employees
                    .find((e) => e.id === upcomingBreak.shift.employeeId)
                    ?.name.split(" ")[0] ??
                  LOCALE.dashboard.attention.breakCover.fallbackName,
              },
        ordersToAssign: ScheduleUtils.unassignedActiveCount(orders),
      }),
    [today, now, upcomingBreak, orders, session?.employeeId, employees],
  );
  const attention = useMemo(
    () =>
      AttentionUtils.buildAttention({
        orders,
        breakNeedingCover,
        breakEmployeeName: employees.find(
          (e) => e.id === breakNeedingCover?.shift.employeeId,
        )?.name,
        inventory: inventoryQuery.data,
        now,
      }),
    [orders, breakNeedingCover, employees, inventoryQuery.data, now],
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
    void ordersQuery.refetch();
    void shiftsQuery.refetch();
  };

  return (
    <Screen testID="DASHBOARD.SCREEN">
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: tabBarInset }]}
        ref={scrollRef}
        refreshControl={
          <RefreshControl
            colors={[colors.accent]}
            refreshing={salesQuery.isRefetching}
            tintColor={colors.accent}
            onRefresh={onRefresh}
          />
        }
        testID="DASHBOARD.SCROLL"
        onTouchStart={() => setChartHour(null)}
      >
        <ScreenTitle
          eyebrow={`${FormatUtils.formatShortDate(now)} · ${DEMO_STORE_SHORT_NAME}`}
          right={
            <>
              <IconButton
                accessibilityLabel={L.notificationsLabel(attention.length)}
                badge={attention.length}
                icon="notifications-outline"
                testID="DASHBOARD.NOTIFICATIONS"
                onPress={showAttention}
              />
              <IconButton
                accessibilityLabel={L.profileLabel(firstName)}
                icon="person-outline"
                testID="DASHBOARD.PROFILE"
                text={session ? AuthUtils.initials(session.name) : ""}
                onPress={() => router.push("/more/settings")}
              />
            </>
          }
          subtitle={session ? ROLE_LABELS[session.role] : ""}
          title={L.greeting(firstName)}
        />

        <View
          style={styles.body}
          testID="DASHBOARD.BODY"
          onLayout={(event) => {
            bodyY.current = event.nativeEvent.layout.y;
          }}
        >
          <ShiftCard testID="DASHBOARD.SHIFT_CARD" {...shiftCard} />

          <View
            style={styles.section}
            testID="DASHBOARD.ATTENTION"
            onLayout={(event) => {
              attentionY.current = event.nativeEvent.layout.y;
            }}
          >
            <Animated.View
              pointerEvents="none"
              style={[styles.highlight, { opacity: highlight }]}
              testID="DASHBOARD.ATTENTION.HIGHLIGHT"
            />
            <View style={styles.sectionHeader}>
              <AppText accessibilityRole="header" variant="sectionTitle">
                {A.title}
              </AppText>
              <AppText color="textMuted" style={styles.small}>
                {A.count(attention.length)}
              </AppText>
            </View>
            {attention.length === 0 ? (
              <AppText color="textMuted" testID="DASHBOARD.ATTENTION_EMPTY">
                {A.empty}
              </AppText>
            ) : (
              attention.map((item) => (
                <AttentionItem
                  icon={item.icon}
                  key={item.key}
                  subtitle={item.subtitle}
                  testID={`DASHBOARD.ATTENTION.${item.key}`}
                  title={item.title}
                  tone={item.tone}
                  onPress={() => router.navigate(item.href)}
                />
              ))
            )}
          </View>

          <View style={styles.section}>
            <AppText accessibilityRole="header" variant="sectionTitle">
              {T.title}
            </AppText>
            {salesQuery.isPending ? (
              <View style={[styles.card, styles.placeholder]}>
                <LoadingState message={T.loading} />
              </View>
            ) : salesQuery.isError ? (
              <View style={styles.card}>
                <ErrorState
                  message={salesQuery.error.message}
                  title={T.errorTitle}
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
                    label={K.transactions.label}
                    style={styles.gridItem}
                    supporting={K.transactions.supporting(
                      FormatUtils.formatClockTime(
                        DateUtils.atTime(
                          now,
                          ShiftUtils.STORE_TRADING_HOURS.open,
                        ) ?? now,
                      ),
                    )}
                    testID="DASHBOARD.KPI_TRANSACTIONS"
                    value={kpis.transactions.toLocaleString("en-AU")}
                  />
                  <KPICard
                    accessibilityLabel={K.averageTransaction.accessibilityLabel(
                      kpis.averageTransactionValue === null
                        ? K.notAvailable
                        : FormatUtils.formatCurrency(
                            kpis.averageTransactionValue,
                            {
                              cents: true,
                            },
                          ),
                    )}
                    label={K.averageTransaction.label}
                    style={styles.gridItem}
                    supporting={K.averageTransaction.supporting}
                    testID="DASHBOARD.KPI_ATV"
                    value={
                      kpis.averageTransactionValue === null
                        ? K.noValue
                        : FormatUtils.formatCurrency(
                            kpis.averageTransactionValue,
                            {
                              cents: true,
                            },
                          )
                    }
                  />
                  <KPICard
                    accessibilityLabel={K.labour.accessibilityLabel(
                      kpis.labourPercent === null
                        ? K.notAvailable
                        : K.labour.ofSales(
                            FormatUtils.formatPercent(kpis.labourPercent, 1),
                          ),
                      FormatUtils.formatCurrency(kpis.labourSpend),
                    )}
                    label={K.labour.label}
                    style={styles.gridItem}
                    supporting={K.labour.ofSales(
                      FormatUtils.formatCurrency(kpis.labourSpend),
                    )}
                    testID="DASHBOARD.KPI_LABOUR"
                    value={FormatUtils.formatPercent(kpis.labourPercent, 1)}
                  />
                </>
              ) : null}
              <KPICard
                accessibilityHint={K.clickAndCollect.hint}
                label={K.clickAndCollect.label}
                style={styles.gridItem}
                supporting={
                  ordersReady
                    ? K.clickAndCollect.readyToCollect(orderCounts.ready)
                    : K.clickAndCollect.loading
                }
                testID="DASHBOARD.KPI_ORDERS"
                value={ordersReady ? String(orderCounts.pending) : K.noValue}
                onPress={() => router.navigate("/orders")}
              />
            </View>
          </View>

          {salesQuery.data ? (
            <View style={styles.card}>
              <SalesChart
                data={salesQuery.data.hourly}
                selectedHour={chartHour}
                onSelectHour={setChartHour}
              />
            </View>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
};

function SalesHero({ kpis }: { kpis: DashboardKpis }) {
  const achievement = kpis.achievementPercent;
  const remaining =
    achievement === null
      ? H.noTarget
      : kpis.remainingToTarget === 0
        ? H.targetReached(FormatUtils.formatCurrency(kpis.target))
        : H.toGo(
            FormatUtils.formatCurrency(kpis.remainingToTarget),
            FormatUtils.formatCurrency(kpis.target),
          );
  const percent =
    achievement === null ? 0 : Math.min(100, Math.max(0, achievement));

  return (
    <View style={styles.card} testID="DASHBOARD.SALES_SUMMARY">
      <AppText color="textMuted" style={styles.small}>
        {H.label}
      </AppText>
      <View style={styles.heroRow}>
        <AppText
          accessibilityLabel={H.totalLabel(
            FormatUtils.formatCurrency(kpis.sales),
          )}
          style={styles.heroValue}
          testID="DASHBOARD.SALES_TOTAL"
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
            ? H.achievementUnavailable
            : H.achievementLabel(
                FormatUtils.formatPercent(achievement, 1),
                remaining,
              )
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
  highlight: {
    position: "absolute",
    top: -spacing.sm,
    bottom: -spacing.sm,
    left: -spacing.sm,
    right: -spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.accentSoft,
  },
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
});
