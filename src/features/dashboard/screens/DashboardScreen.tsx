import { useRouter } from 'expo-router';
import { useMemo, useRef } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import {
  AppText,
  AttentionItem,
  ErrorState,
  IconButton,
  KPICard,
  LoadingState,
  ScreenTitle,
  ShiftCard,
} from '@/components/ui';
import { useInventory } from '@/features/inventory/hooks/useInventory';
import { unassignedActiveCount } from '@/features/orders/domain/schedule';
import { useEnsureOrdersLoaded } from '@/features/orders/hooks/useEnsureOrdersLoaded';
import { useOrdersStore } from '@/features/orders/store/useOrdersStore';
import { atTime } from '@/features/roster/domain/dates';
import { nextBreak, staffOnFloor } from '@/features/roster/domain/cover';
import { STORE_TRADING_HOURS, shiftsOnDay } from '@/features/roster/domain/shifts';
import { useRosterStore } from '@/features/roster/store/useRosterStore';
import { useNow } from '@/hooks/useNow';
import { formatClockTime, formatCurrency, formatPercent, formatShortDate } from '@/lib/format';
import { DEMO_STORE_ID, DEMO_STORE_SHORT_NAME } from '@/mocks/store';
import { DEMO_USER } from '@/mocks/user';
import { colors, fontFamily, radius, spacing } from '@/theme';

import { SalesChart } from '../components/SalesChart';
import { buildAttention } from '../domain/attention';
import { calculateDashboardKpis, type DashboardKpis } from '../domain/kpis';
import { shiftCardModel } from '../domain/shiftCard';
import { useStoreSalesSummary } from '../hooks/useStoreSalesSummary';

const NOT_AVAILABLE = 'not available';

export function DashboardScreen({ now: fixedNow }: { now?: Date } = {}) {
  const router = useRouter();
  const liveNow = useNow();
  const now = fixedNow ?? liveNow;
  const scrollRef = useRef<ScrollView>(null);
  const attentionY = useRef(0);

  const salesQuery = useStoreSalesSummary(DEMO_STORE_ID);
  const inventoryQuery = useInventory();
  const kpis = useMemo(() => (salesQuery.data ? calculateDashboardKpis(salesQuery.data) : null), [salesQuery.data]);

  const ordersLoadStatus = useEnsureOrdersLoaded();
  const orders = useOrdersStore((s) => s.orders);
  const refreshOrders = useOrdersStore((s) => s.refreshOrders);
  const ordersReady = ordersLoadStatus === 'ready' || orders.length > 0;

  const shifts = useRosterStore((s) => s.shifts);
  const employees = useRosterStore((s) => s.employees);

  const today = useMemo(() => shiftsOnDay(shifts, now), [shifts, now]);
  const upcomingBreak = useMemo(() => nextBreak(today, now), [today, now]);
  const shiftCard = useMemo(
    () =>
      shiftCardModel({
        myShift: today.find((s) => s.employeeId === DEMO_USER.employeeId),
        now,
        staffOnFloor: staffOnFloor(today, now).length,
        nextBreakAt: upcomingBreak?.startsAt ?? null,
        ordersToAssign: unassignedActiveCount(orders),
      }),
    [today, now, upcomingBreak, orders],
  );
  const attention = useMemo(
    () =>
      buildAttention({
        orders,
        upcomingBreak,
        breakEmployeeName: employees.find((e) => e.id === upcomingBreak?.shift.employeeId)?.name,
        inventory: inventoryQuery.data,
        now,
      }),
    [orders, upcomingBreak, employees, inventoryQuery.data, now],
  );
  const orderCounts = useMemo(
    () => ({
      pending: orders.filter((o) => o.status === 'NEW' || o.status === 'PICKING').length,
      ready: orders.filter((o) => o.status === 'READY').length,
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
        ref={scrollRef}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={salesQuery.isRefetching}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        <ScreenTitle
          eyebrow={`${formatShortDate(now)} · ${DEMO_STORE_SHORT_NAME}`}
          title={`Hi, ${DEMO_USER.firstName}`}
          subtitle={DEMO_USER.role}
          right={
            <>
              <IconButton
                testID="notifications"
                icon="notifications-outline"
                accessibilityLabel={`Notifications, ${attention.length} ${attention.length === 1 ? 'item needs' : 'items need'} attention`}
                badge={attention.length}
                onPress={() => scrollRef.current?.scrollTo({ y: attentionY.current, animated: true })}
              />
              <IconButton
                testID="profile"
                icon="person-outline"
                text={DEMO_USER.firstName.slice(0, 2).toUpperCase()}
                accessibilityLabel={`Profile and settings, ${DEMO_USER.firstName}`}
                onPress={() => router.push('/more/settings')}
              />
            </>
          }
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
              <AppText variant="sectionTitle" accessibilityRole="header">
                Needs attention
              </AppText>
              <AppText color="textMuted" style={styles.small}>
                {attention.length === 1 ? '1 item' : `${attention.length} items`}
              </AppText>
            </View>
            {attention.length === 0 ? (
              <AppText color="textMuted" testID="attention-empty">
                Nothing needs attention right now.
              </AppText>
            ) : (
              attention.map((item) => (
                <AttentionItem
                  key={item.key}
                  testID={`attention-${item.key}`}
                  title={item.title}
                  subtitle={item.subtitle}
                  icon={item.icon}
                  tone={item.tone}
                  onPress={() => router.navigate(item.href)}
                />
              ))
            )}
          </View>

          <View style={styles.section}>
            <AppText variant="sectionTitle" accessibilityRole="header">
              Today so far
            </AppText>
            {salesQuery.isPending ? (
              <View style={[styles.card, styles.placeholder]}>
                <LoadingState message="Loading today's sales" />
              </View>
            ) : salesQuery.isError ? (
              <View style={styles.card}>
                <ErrorState
                  title="Couldn't load sales"
                  message={salesQuery.error.message}
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
                    testID="kpi-transactions"
                    style={styles.gridItem}
                    label="Transactions"
                    value={kpis.transactions.toLocaleString('en-AU')}
                    supporting={`Since ${formatClockTime(atTime(now, STORE_TRADING_HOURS.open) ?? now)}`}
                  />
                  <KPICard
                    testID="kpi-atv"
                    style={styles.gridItem}
                    label="Avg transaction"
                    value={
                      kpis.averageTransactionValue === null
                        ? '—'
                        : formatCurrency(kpis.averageTransactionValue, { cents: true })
                    }
                    supporting="Sales ÷ transactions"
                    accessibilityLabel={`Average transaction value, ${
                      kpis.averageTransactionValue === null
                        ? NOT_AVAILABLE
                        : formatCurrency(kpis.averageTransactionValue, { cents: true })
                    }`}
                  />
                  <KPICard
                    testID="kpi-labour"
                    style={styles.gridItem}
                    label="Labour"
                    value={formatPercent(kpis.labourPercent, 1)}
                    supporting={`${formatCurrency(kpis.labourSpend)} of sales`}
                    accessibilityLabel={`Labour, ${
                      kpis.labourPercent === null ? NOT_AVAILABLE : `${formatPercent(kpis.labourPercent, 1)} of sales`
                    }, ${formatCurrency(kpis.labourSpend)} estimated spend`}
                  />
                </>
              ) : null}
              <KPICard
                testID="kpi-orders"
                style={styles.gridItem}
                label="Click & Collect"
                value={ordersReady ? String(orderCounts.pending) : '—'}
                supporting={ordersReady ? `${orderCounts.ready} ready to collect` : 'Loading orders'}
                onPress={() => router.navigate('/orders')}
                accessibilityHint="Opens Click & Collect orders"
              />
            </View>
          </View>

          {salesQuery.data ? (
            <View style={styles.card}>
              <SalesChart data={salesQuery.data.hourly} />
            </View>
          ) : null}

          <AppText variant="supporting" color="textMuted" style={styles.footnote}>
            Demo mode with fictional data. Labour is a flat-rate estimate, not a payroll calculation.
          </AppText>
        </View>
      </ScrollView>
    </Screen>
  );
}

function SalesHero({ kpis }: { kpis: DashboardKpis }) {
  const achievement = kpis.achievementPercent;
  const remaining =
    achievement === null
      ? 'No sales target set for today'
      : kpis.remainingToTarget === 0
        ? `Target ${formatCurrency(kpis.target)} reached`
        : `${formatCurrency(kpis.remainingToTarget)} to go · target ${formatCurrency(kpis.target)}`;
  const percent = achievement === null ? 0 : Math.min(100, Math.max(0, achievement));

  return (
    <View style={styles.card} testID="sales-summary">
      <AppText color="textMuted" style={styles.small}>
        Sales
      </AppText>
      <View style={styles.heroRow}>
        <AppText variant="hero" style={styles.heroValue} testID="sales-total" accessibilityLabel={`Today's sales ${formatCurrency(kpis.sales)}`}>
          {formatCurrency(kpis.sales)}
        </AppText>
        <AppText style={styles.heroPercent}>{formatPercent(achievement, 1)}</AppText>
      </View>
      <View
        style={styles.track}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={
          achievement === null ? `Sales target achievement ${NOT_AVAILABLE}` : `Sales target achievement ${formatPercent(achievement, 1)}. ${remaining}`
        }
        accessibilityValue={{ min: 0, max: 100, now: Math.round(percent) }}
      >
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>
      <AppText variant="supporting" color="textMuted">
        {remaining}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  body: { paddingHorizontal: spacing.xl, gap: spacing.xxl },
  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
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
  heroRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  heroValue: { fontSize: 44, lineHeight: 50 },
  heroPercent: { fontFamily: fontFamily.semibold, fontSize: 14, color: colors.successDark },
  track: { height: 6, borderRadius: radius.pill, backgroundColor: colors.track, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.success },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem: { flexGrow: 1, flexBasis: '45%' },
  footnote: { textAlign: 'center' },
});
