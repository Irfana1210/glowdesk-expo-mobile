import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/layout/AppHeader';
import { Screen } from '@/components/layout/Screen';
import { AppText, EmptyState, InlineBanner, PrimaryButton } from '@/components/ui';
import { formatClockTime } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';

import { ShiftCard } from '../components/ShiftCard';
import { WeekDaySelector } from '../components/WeekDaySelector';
import { WeekNavigator } from '../components/WeekNavigator';
import { atTime, formatDayLabel, isSameDay, startOfWeek, toDateKey, weekDays } from '../domain/dates';
import {
  STORE_TRADING_HOURS,
  coverageGaps,
  formatHours,
  shiftsInWeek,
  shiftsOnDay,
  staffCount,
  totalPaidMinutes,
} from '../domain/shifts';
import { useRosterStore } from '../store/useRosterStore';

export function RosterScreen({ now = new Date() }: { now?: Date }) {
  const router = useRouter();
  const shifts = useRosterStore((s) => s.shifts);
  const employees = useRosterStore((s) => s.employees);
  const employeesById = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);

  const [weekStart, setWeekStart] = useState(() => startOfWeek(now));
  const [selected, setSelected] = useState(() => now);

  const goToWeek = (start: Date) => {
    setWeekStart(start);
    setSelected(isSameDay(start, startOfWeek(now)) ? now : start);
  };

  const weekShifts = useMemo(() => shiftsInWeek(shifts, weekStart), [shifts, weekStart]);
  const days = useMemo(
    () =>
      weekDays(weekStart).map((date) => {
        const dayShifts = shiftsOnDay(weekShifts, date);
        // Coverage counts the previous night's overnight shifts too.
        return { date, staff: staffCount(dayShifts), hasGap: coverageGaps(weekShifts, date).length > 0 };
      }),
    [weekShifts, weekStart],
  );
  const dayShifts = useMemo(() => shiftsOnDay(shifts, selected), [shifts, selected]);
  const gaps = useMemo(() => coverageGaps(shifts, selected), [shifts, selected]);

  const openShift = useCallback(
    (shiftId: string) => router.push({ pathname: '/roster/shift', params: { shiftId } }),
    [router],
  );
  const addShift = () => router.push({ pathname: '/roster/shift', params: { date: toDateKey(selected) } });

  const tradingHours = [STORE_TRADING_HOURS.open, STORE_TRADING_HOURS.close]
    .map((time) => formatClockTime(atTime(selected, time) ?? selected))
    .join(' – ');

  return (
    <Screen testID="roster-screen">
      <AppHeader title="Roster" subtitle={`${formatHours(totalPaidMinutes(weekShifts))} scheduled this week`} />
      <WeekNavigator weekStart={weekStart} now={now} onChange={goToWeek} />

      <View style={styles.days}>
        <WeekDaySelector days={days} selected={selected} today={now} onSelect={setSelected} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summary} testID="day-summary">
          <View style={styles.summaryTop}>
            <AppText variant="cardTitle">{formatDayLabel(selected)}</AppText>
            <AppText color="textMuted" testID="day-totals">
              {staffCount(dayShifts)} staff · {formatHours(totalPaidMinutes(dayShifts))} paid
            </AppText>
          </View>
          {gaps.length === 0 ? (
            <InlineBanner tone="success" message={`Covered for all trading hours, ${tradingHours}.`} testID="coverage" />
          ) : (
            <InlineBanner
              tone="error"
              testID="coverage"
              message={`No one rostered ${gaps
                .map((g) => `${formatClockTime(g.start)} – ${formatClockTime(g.end)}`)
                .join(', ')}.`}
            />
          )}
        </View>

        {dayShifts.length === 0 ? (
          <EmptyState icon="calendar-clear-outline" title="No shifts" message={`Nobody is rostered on ${formatDayLabel(selected)}.`} />
        ) : (
          <View style={styles.list}>
            {dayShifts.map((shift) => (
              <ShiftCard key={shift.id} shift={shift} employee={employeesById.get(shift.employeeId)} onPress={openShift} />
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton testID="add-shift" label="Add Shift" icon="add" onPress={addShift} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  days: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  summary: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  summaryTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: spacing.sm },
  list: { gap: spacing.sm },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
