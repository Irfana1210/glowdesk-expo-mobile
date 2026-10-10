import { type FC, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useRouter } from "expo-router";

import { formatCurrency, formatPercent } from "@/utils/format-utils";

import { ROLE_LABELS } from "@/features/employees/types";
import { WeekNavigator } from "@/features/roster/components/week-navigator";
import { formatDayLabel, startOfWeek } from "@/features/roster/domain/dates";
import { formatHours } from "@/features/roster/domain/shifts";
import { useRosterStore } from "@/features/roster/store/roster.store";
import {
  canViewPayInformation,
  useSessionStore,
} from "@/features/session/session.store";

import { AppHeader } from "@/components/layout/app-header";
import { Screen } from "@/components/layout/screen";
import { AppText } from "@/components/ui/app-text";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineBanner } from "@/components/ui/inline-banner";
import { KPICard } from "@/components/ui/kpi-card";
import { SecondaryButton } from "@/components/ui/secondary-button";

import {
  MOCK_PAY_RATES,
  WEEKLY_LABOUR_BUDGET,
  WEEKLY_SALES_FORECAST,
} from "@/mocks/pay-rates";
import { colors, radius, spacing } from "@/theme";

import { weeklyLabourSummary } from "../domain/labour";

export const LabourScreen: FC<{ now?: Date }> = ({ now = new Date() }) => {
  const router = useRouter();
  const role = useSessionStore((s) => s.role);
  const goBack = () =>
    router.canGoBack() ? router.back() : router.replace("/more");

  if (!canViewPayInformation(role)) {
    return (
      <Screen testID="labour-screen">
        <AppHeader title="Labour Management" onBack={goBack} />
        <EmptyState
          icon="lock-closed-outline"
          message="Labour costs include confidential pay information, so only store managers can view them."
          title="Managers only"
        />
      </Screen>
    );
  }
  return <LabourContent now={now} onBack={goBack} />;
};

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
      <WeekNavigator now={now} weekStart={weekStart} onChange={setWeekStart} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.lg },
        ]}
      >
        <InlineBanner
          message="Estimate only: paid hours × base hourly rate. Not a payroll calculation. Award penalty rates, overtime, allowances and superannuation are not included."
          testID="labour-disclaimer"
          tone="info"
        />

        {summary.missingRateEmployeeIds.length > 0 ? (
          <InlineBanner
            message={`No pay rate for ${summary.missingRateEmployeeIds.length} rostered employee(s). Their shifts are not included in the cost.`}
            testID="missing-rates"
            tone="error"
          />
        ) : null}

        <View style={styles.grid}>
          <KPICard
            icon="wallet-outline"
            label="Estimated roster cost"
            style={styles.gridItem}
            supporting={`${formatHours(summary.totalPaidMinutes)} paid`}
            testID="labour-cost"
            value={formatCurrency(summary.totalCost)}
          />
          <KPICard
            icon={overBudget ? "warning-outline" : "checkmark-circle-outline"}
            label="Labour budget"
            style={styles.gridItem}
            supporting={
              overBudget
                ? `${formatCurrency(-summary.budgetRemaining)} over budget`
                : `${formatCurrency(summary.budgetRemaining)} remaining`
            }
            testID="labour-budget"
            value={formatCurrency(summary.budget)}
          />
          <KPICard
            accessibilityLabel={`Labour percentage of forecast sales, ${
              summary.labourPercent === null
                ? "not available"
                : formatPercent(summary.labourPercent, 1)
            }`}
            icon="pie-chart-outline"
            label="Labour % of forecast sales"
            style={styles.gridItem}
            supporting={`Forecast ${formatCurrency(summary.forecastSales)}`}
            testID="labour-percent"
            value={formatPercent(summary.labourPercent, 1)}
          />
        </View>

        <View style={styles.card}>
          <AppText accessibilityRole="header" variant="cardTitle">
            Daily labour cost
          </AppText>
          {summary.byDay.map((day) => (
            <View
              accessible
              accessibilityLabel={`${formatDayLabel(day.date)}: ${formatCurrency(day.cost)}, ${formatHours(day.paidMinutes)} paid`}
              key={day.date.toISOString()}
              style={styles.dayRow}
            >
              <AppText style={styles.dayLabel}>
                {formatDayLabel(day.date)}
              </AppText>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    { width: `${(day.cost / maxDayCost) * 100}%` },
                  ]}
                />
              </View>
              <AppText style={styles.dayCost} variant="bodyStrong">
                {formatCurrency(day.cost)}
              </AppText>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <AppText accessibilityRole="header" variant="cardTitle">
            Cost by employee
          </AppText>
          {summary.byEmployee.length === 0 ? (
            <AppText color="textMuted">No shifts rostered this week.</AppText>
          ) : (
            summary.byEmployee.map((row) => (
              <View
                accessible
                accessibilityLabel={`${row.employee?.name ?? "Unknown"}: ${formatCurrency(row.cost, { cents: true })}, ${formatHours(row.paidMinutes)} over ${row.shiftCount} shifts`}
                key={row.employeeId}
                style={styles.employeeRow}
                testID={`employee-cost-${row.employeeId}`}
              >
                <View style={styles.flex}>
                  <AppText variant="bodyStrong">
                    {row.employee?.name ?? "Unknown employee"}
                  </AppText>
                  <AppText color="textMuted" variant="supporting">
                    {row.employee ? ROLE_LABELS[row.employee.role] : ""} ·{" "}
                    {formatHours(row.paidMinutes)} · {row.shiftCount} shifts
                  </AppText>
                </View>
                <AppText variant="bodyStrong">
                  {formatCurrency(row.cost, { cents: true })}
                </AppText>
              </View>
            ))
          )}
        </View>

        <SecondaryButton
          accessibilityHint="Costs here update as soon as shifts change"
          icon="calendar-outline"
          label="Adjust shifts in the roster"
          testID="adjust-shifts"
          onPress={() => router.navigate("/roster")}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  gridItem: { flexGrow: 1, flexBasis: "45%" },
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  dayRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  dayLabel: { width: 84 },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.neutralSoft,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  dayCost: { minWidth: 64, textAlign: "right" },
  employeeRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
});
