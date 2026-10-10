import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/AppHeader';
import { Screen } from '@/components/layout/Screen';
import { AppText, EmptyState, InlineBanner, KPICard, SecondaryButton } from '@/components/ui';
import { WeekNavigator } from '@/features/roster/components/WeekNavigator';
import { formatDayLabel, startOfWeek } from '@/features/roster/domain/dates';
import { formatHours } from '@/features/roster/domain/shifts';
import { useRosterStore } from '@/features/roster/store/useRosterStore';
import { ROLE_LABELS } from '@/features/employees/types';
import { canViewPayInformation, useSessionStore } from '@/features/session/useSessionStore';
import { formatCurrency, formatPercent } from '@/lib/format';
import { MOCK_PAY_RATES, WEEKLY_LABOUR_BUDGET, WEEKLY_SALES_FORECAST } from '@/mocks/payRates';
import { colors, radius, spacing } from '@/theme';

import { weeklyLabourSummary } from '../domain/labour';

export function LabourScreen({ now = new Date() }: { now?: Date }) {
  const router = useRouter();
  const role = useSessionStore((s) => s.role);
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/more'));

  if (!canViewPayInformation(role)) {
    return (
      <Screen testID="labour-screen">
        <AppHeader title="Labour Management" onBack={goBack} />
        <EmptyState
          icon="lock-closed-outline"
          title="Managers only"
          message="Labour costs include confidential pay information, so only store managers can view them."
        />
      </Screen>
    );
  }
  return <LabourContent now={now} onBack={goBack} />;
}

function LabourContent({ now, onBack }: { now: Date; onBack: () => void }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const shifts = useRosterStore((s) => s.shifts);
  const employees = useRosterStore((s) => s.employees);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(now));

  // Derived straight from the roster store, so any shift change recalculates immediately.
  const summary = useMemo(
    () =>
      weeklyLabourSummary({
        weekStart,
        shifts,
        employees,
        rates: MOCK_PAY_RATES,
        budget: WEEKLY_LABOUR_BUDGET,
        salesForecastByWeekday: WEEKLY_SALES_FORECAST,
      }),
    [weekStart, shifts, employees],
  );
  const maxDayCost = Math.max(...summary.byDay.map((d) => d.cost), 1);
  const overBudget = summary.budgetRemaining < 0;

  return (
    <Screen testID="labour-screen">
      <AppHeader title="Labour Management" onBack={onBack} />
      <WeekNavigator weekStart={weekStart} now={now} onChange={setWeekStart} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.lg }]}>
        <InlineBanner
          tone="info"
          testID="labour-disclaimer"
          message="Estimate only: paid hours × base hourly rate. Not a payroll calculation. Award penalty rates, overtime, allowances and superannuation are not included."
        />

        {summary.missingRateEmployeeIds.length > 0 ? (
          <InlineBanner
            tone="error"
            testID="missing-rates"
            message={`No pay rate for ${summary.missingRateEmployeeIds.length} rostered employee(s). Their shifts are not included in the cost.`}
          />
        ) : null}

        <View style={styles.grid}>
          <KPICard
            testID="labour-cost"
            style={styles.gridItem}
            icon="wallet-outline"
            label="Estimated roster cost"
            value={formatCurrency(summary.totalCost)}
            supporting={`${formatHours(summary.totalPaidMinutes)} paid`}
          />
          <KPICard
            testID="labour-budget"
            style={styles.gridItem}
            icon={overBudget ? 'warning-outline' : 'checkmark-circle-outline'}
            label="Labour budget"
            value={formatCurrency(summary.budget)}
            supporting={
              overBudget
                ? `${formatCurrency(-summary.budgetRemaining)} over budget`
                : `${formatCurrency(summary.budgetRemaining)} remaining`
            }
          />
          <KPICard
            testID="labour-percent"
            style={styles.gridItem}
            icon="pie-chart-outline"
            label="Labour % of forecast sales"
            value={formatPercent(summary.labourPercent, 1)}
            supporting={`Forecast ${formatCurrency(summary.forecastSales)}`}
            accessibilityLabel={`Labour percentage of forecast sales, ${
              summary.labourPercent === null ? 'not available' : formatPercent(summary.labourPercent, 1)
            }`}
          />
        </View>

        <View style={styles.card}>
          <AppText variant="cardTitle" accessibilityRole="header">
            Daily labour cost
          </AppText>
          {summary.byDay.map((day) => (
            <View
              key={day.date.toISOString()}
              style={styles.dayRow}
              accessible
              accessibilityLabel={`${formatDayLabel(day.date)}: ${formatCurrency(day.cost)}, ${formatHours(day.paidMinutes)} paid`}
            >
              <AppText style={styles.dayLabel}>{formatDayLabel(day.date)}</AppText>
              <View style={styles.barTrack}>
                <View style={[styles.bar, { width: `${(day.cost / maxDayCost) * 100}%` }]} />
              </View>
              <AppText variant="bodyStrong" style={styles.dayCost}>
                {formatCurrency(day.cost)}
              </AppText>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <AppText variant="cardTitle" accessibilityRole="header">
            Cost by employee
          </AppText>
          {summary.byEmployee.length === 0 ? (
            <AppText color="textMuted">No shifts rostered this week.</AppText>
          ) : (
            summary.byEmployee.map((row) => (
              <View
                key={row.employeeId}
                testID={`employee-cost-${row.employeeId}`}
                style={styles.employeeRow}
                accessible
                accessibilityLabel={`${row.employee?.name ?? 'Unknown'}: ${formatCurrency(row.cost, { cents: true })}, ${formatHours(row.paidMinutes)} over ${row.shiftCount} shifts`}
              >
                <View style={styles.flex}>
                  <AppText variant="bodyStrong">{row.employee?.name ?? 'Unknown employee'}</AppText>
                  <AppText variant="supporting" color="textMuted">
                    {row.employee ? ROLE_LABELS[row.employee.role] : ''} · {formatHours(row.paidMinutes)} · {row.shiftCount} shifts
                  </AppText>
                </View>
                <AppText variant="bodyStrong">{formatCurrency(row.cost, { cents: true })}</AppText>
              </View>
            ))
          )}
        </View>

        <SecondaryButton
          testID="adjust-shifts"
          label="Adjust shifts in the roster"
          icon="calendar-outline"
          onPress={() => router.navigate('/roster')}
          accessibilityHint="Costs here update as soon as shifts change"
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  gridItem: { flexGrow: 1, flexBasis: '45%' },
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dayLabel: { width: 84 },
  barTrack: { flex: 1, height: 8, borderRadius: radius.pill, backgroundColor: colors.neutralSoft, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.accent },
  dayCost: { minWidth: 64, textAlign: 'right' },
  employeeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
