import { type FC, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useRouter } from "expo-router";

import { LOCALE } from "@/constants/locale";

import { FormatUtils } from "@/utils/format-utils";

import { ROLE_LABELS } from "@/features/employees/types";
import { WeekNavigator } from "@/features/roster/components/week-navigator";
import { DateUtils } from "@/features/roster/domain/dates";
import { ShiftUtils } from "@/features/roster/domain/shifts";
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

import { LabourUtils } from "../domain/labour";

const L = LOCALE.labour.labour;
const RESTRICTED = LOCALE.labour.restricted;

export const LabourScreen: FC<{ now?: Date }> = ({ now = new Date() }) => {
  const router = useRouter();
  const role = useSessionStore((s) => s.role);
  const goBack = () =>
    router.canGoBack() ? router.back() : router.replace("/more");

  if (!canViewPayInformation(role)) {
    return (
      <Screen testID="LABOUR.SCREEN">
        <AppHeader title={L.title} onBack={goBack} />
        <EmptyState
          icon="lock-closed-outline"
          message={RESTRICTED.message}
          title={RESTRICTED.title}
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
  const [weekStart, setWeekStart] = useState(() => DateUtils.startOfWeek(now));

  // Derived straight from the roster store, so any shift change recalculates immediately.
  const summary = useMemo(
    () =>
      LabourUtils.weeklyLabourSummary({
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
    <Screen testID="LABOUR.SCREEN">
      <AppHeader title={L.title} onBack={onBack} />
      <WeekNavigator now={now} weekStart={weekStart} onChange={setWeekStart} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.lg },
        ]}
      >
        <InlineBanner
          message={L.disclaimer}
          testID="LABOUR.DISCLAIMER"
          tone="info"
        />

        {summary.missingRateEmployeeIds.length > 0 ? (
          <InlineBanner
            message={L.missingRates(summary.missingRateEmployeeIds.length)}
            testID="LABOUR.MISSING_RATES"
            tone="error"
          />
        ) : null}

        <View style={styles.grid}>
          <KPICard
            icon="wallet-outline"
            label={L.costLabel}
            style={styles.gridItem}
            supporting={L.paid(
              ShiftUtils.formatHours(summary.totalPaidMinutes),
            )}
            testID="LABOUR.COST"
            value={FormatUtils.formatCurrency(summary.totalCost)}
          />
          <KPICard
            icon={overBudget ? "warning-outline" : "checkmark-circle-outline"}
            label={L.budgetLabel}
            style={styles.gridItem}
            supporting={
              overBudget
                ? L.budgetOver(
                    FormatUtils.formatCurrency(-summary.budgetRemaining),
                  )
                : L.budgetRemaining(
                    FormatUtils.formatCurrency(summary.budgetRemaining),
                  )
            }
            testID="LABOUR.BUDGET"
            value={FormatUtils.formatCurrency(summary.budget)}
          />
          <KPICard
            accessibilityLabel={L.percentA11y(
              summary.labourPercent === null
                ? L.percentNotAvailable
                : FormatUtils.formatPercent(summary.labourPercent, 1),
            )}
            icon="pie-chart-outline"
            label={L.percentLabel}
            style={styles.gridItem}
            supporting={L.forecast(
              FormatUtils.formatCurrency(summary.forecastSales),
            )}
            testID="LABOUR.PERCENT"
            value={FormatUtils.formatPercent(summary.labourPercent, 1)}
          />
        </View>

        <View style={styles.card}>
          <AppText accessibilityRole="header" variant="cardTitle">
            {L.dailyCost}
          </AppText>
          {summary.byDay.map((day) => (
            <View
              accessible
              accessibilityLabel={L.dayA11y(
                DateUtils.formatDayLabel(day.date),
                FormatUtils.formatCurrency(day.cost),
                ShiftUtils.formatHours(day.paidMinutes),
              )}
              key={day.date.toISOString()}
              style={styles.dayRow}
            >
              <AppText style={styles.dayLabel}>
                {DateUtils.formatDayLabel(day.date)}
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
                {FormatUtils.formatCurrency(day.cost)}
              </AppText>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <AppText accessibilityRole="header" variant="cardTitle">
            {L.costByEmployee}
          </AppText>
          {summary.byEmployee.length === 0 ? (
            <AppText color="textMuted">{L.noShifts}</AppText>
          ) : (
            summary.byEmployee.map((row) => (
              <View
                accessible
                accessibilityLabel={L.employeeA11y(
                  row.employee?.name ?? L.unknown,
                  FormatUtils.formatCurrency(row.cost, { cents: true }),
                  ShiftUtils.formatHours(row.paidMinutes),
                  row.shiftCount,
                )}
                key={row.employeeId}
                style={styles.employeeRow}
                testID={`LABOUR.EMPLOYEE_COST.${row.employeeId}`}
              >
                <View style={styles.flex}>
                  <AppText variant="bodyStrong">
                    {row.employee?.name ?? L.unknownEmployee}
                  </AppText>
                  <AppText color="textMuted" variant="supporting">
                    {L.employeeMeta(
                      row.employee ? ROLE_LABELS[row.employee.role] : "",
                      ShiftUtils.formatHours(row.paidMinutes),
                      row.shiftCount,
                    )}
                  </AppText>
                </View>
                <AppText variant="bodyStrong">
                  {FormatUtils.formatCurrency(row.cost, { cents: true })}
                </AppText>
              </View>
            ))
          )}
        </View>

        <SecondaryButton
          accessibilityHint={L.adjustShiftsHint}
          icon="calendar-outline"
          label={L.adjustShifts}
          testID="LABOUR.ADJUST_SHIFTS"
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
