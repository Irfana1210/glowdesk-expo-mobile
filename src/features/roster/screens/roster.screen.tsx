import { type FC, useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";

import { FormatUtils } from "@/utils/format-utils";

import { useNow } from "@/hooks/use-now";

import {
  type Employee,
  EMPLOYMENT_TYPE_LABELS,
  ROLE_LABELS,
} from "@/features/employees/types";

import { Screen } from "@/components/layout/screen";
import { AppText } from "@/components/ui/app-text";
import { EmptyState } from "@/components/ui/empty-state";
import { PrimaryButton } from "@/components/ui/primary-button";
import { ScreenTitle } from "@/components/ui/screen-title";
import { ShiftRow } from "@/components/ui/shift-row";

import { DEMO_USER } from "@/mocks/user";
import {
  colors,
  fontFamily,
  radius,
  spacing,
  swatches,
  touchTarget,
} from "@/theme";

import { FloorCoverChart } from "../components/floor-cover-chart";
import { WeekDaySelector } from "../components/week-day-selector";
import { CoverUtils } from "../domain/cover";
import { DateUtils } from "../domain/dates";
import { ShiftUtils } from "../domain/shifts";
import { useRosterStore } from "../store/roster.store";
import { type Shift } from "../types";

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export const RosterScreen: FC<{ now?: Date }> = ({ now: fixedNow }) => {
  const router = useRouter();
  const liveNow = useNow();
  const now = fixedNow ?? liveNow;
  const shifts = useRosterStore((s) => s.shifts);
  const employees = useRosterStore((s) => s.employees);

  const [weekStart, setWeekStart] = useState(() => DateUtils.startOfWeek(now));
  const [selected, setSelected] = useState(() => now);
  const isCurrentWeek = DateUtils.isSameDay(
    weekStart,
    DateUtils.startOfWeek(now),
  );
  const isToday = DateUtils.isSameDay(selected, now);

  const goToWeek = (start: Date) => {
    setWeekStart(start);
    setSelected(
      DateUtils.isSameDay(start, DateUtils.startOfWeek(now)) ? now : start,
    );
  };

  const employeesById = useMemo(
    () => new Map(employees.map((e) => [e.id, e])),
    [employees],
  );
  /** Stable tint per person, so someone keeps the same avatar colour every day. */
  const avatarColor = useCallback(
    (employeeId: string) =>
      swatches[
        Math.max(
          0,
          employees.findIndex((e) => e.id === employeeId),
        ) % swatches.length
      ],
    [employees],
  );

  const weekTotal = useMemo(
    () =>
      ShiftUtils.totalPaidMinutes(ShiftUtils.shiftsInWeek(shifts, weekStart)),
    [shifts, weekStart],
  );
  const dayShifts = useMemo(
    () =>
      CoverUtils.sortShiftsForDay(
        ShiftUtils.shiftsOnDay(shifts, selected),
        selected,
        now,
      ),
    [shifts, selected, now],
  );
  const cover = useMemo(
    () => CoverUtils.hourlyCover(shifts, selected),
    [shifts, selected],
  );

  const openShift = (shiftId: string) =>
    router.push({ pathname: "/roster/shift", params: { shiftId } });
  const addShift = () =>
    router.push({
      pathname: "/roster/shift",
      params: { date: DateUtils.toDateKey(selected) },
    });

  return (
    <Screen testID="roster-screen">
      <ScreenTitle
        eyebrow="Team"
        right={
          <View style={styles.weekNav}>
            <Pressable
              accessibilityLabel="Previous week"
              accessibilityRole="button"
              style={styles.navButton}
              testID="previous-week"
              onPress={() => goToWeek(DateUtils.addDays(weekStart, -7))}
            >
              <Ionicons color={colors.text} name="chevron-back" size={20} />
            </Pressable>
            <Pressable
              accessibilityHint={
                isCurrentWeek ? undefined : "Returns to this week"
              }
              accessibilityLabel={`Week of ${DateUtils.formatWeekRangeShort(weekStart)}${isCurrentWeek ? ", this week" : ""}`}
              accessibilityRole="button"
              disabled={isCurrentWeek}
              style={styles.weekLabel}
              testID="week-range"
              onPress={() => goToWeek(DateUtils.startOfWeek(now))}
            >
              <AppText style={styles.weekText}>
                {DateUtils.formatWeekRangeShort(weekStart)}
              </AppText>
              {!isCurrentWeek ? (
                <AppText style={styles.thisWeek}>This week</AppText>
              ) : null}
            </Pressable>
            <Pressable
              accessibilityLabel="Next week"
              accessibilityRole="button"
              style={styles.navButton}
              testID="next-week"
              onPress={() => goToWeek(DateUtils.addDays(weekStart, 7))}
            >
              <Ionicons color={colors.text} name="chevron-forward" size={20} />
            </Pressable>
          </View>
        }
        title="Roster"
      />

      <View style={styles.days}>
        <WeekDaySelector
          days={DateUtils.weekDays(weekStart)}
          selected={selected}
          today={now}
          onSelect={setSelected}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <AppText
              accessibilityRole="header"
              style={styles.flex}
              variant="cardTitle"
            >
              Floor cover · {DateUtils.formatDayLabel(selected)}
            </AppText>
            <AppText color="textMuted" testID="day-totals" variant="supporting">
              {ShiftUtils.staffCount(dayShifts)} staff ·{" "}
              {ShiftUtils.formatHours(
                ShiftUtils.totalPaidMinutes(dayShifts),
              ).replace("h", " h")}
            </AppText>
          </View>
          <FloorCoverChart cover={cover} />
        </View>

        {dayShifts.length === 0 ? (
          <EmptyState
            icon="calendar-clear-outline"
            message={`Nobody is rostered on ${DateUtils.formatDayLabel(selected)}.`}
            title="No shifts"
          />
        ) : (
          dayShifts.map((shift) => (
            <RosterRow
              avatarColor={avatarColor(shift.employeeId)}
              employee={employeesById.get(shift.employeeId)}
              key={shift.id}
              now={now}
              shift={shift}
              showState={isToday}
              onEdit={openShift}
            />
          ))
        )}

        <AppText
          color="textMuted"
          style={styles.note}
          testID="week-total"
          variant="supporting"
        >
          {ShiftUtils.formatHours(weekTotal).replace("h", " h")} scheduled this
          week. Hours only. Pay rates are visible to managers.
        </AppText>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          icon="add"
          label="Add shift"
          testID="add-shift"
          onPress={addShift}
        />
      </View>
    </Screen>
  );
};

type RosterRowProps = {
  avatarColor: string | undefined;
  employee: Employee | undefined;
  now: Date;
  onEdit: (shiftId: string) => void;
  shift: Shift;
  showState: boolean;
};

function RosterRow({
  shift,
  employee,
  avatarColor,
  now,
  showState,
  onEdit,
}: RosterRowProps) {
  const name = employee?.name ?? "Unknown employee";
  const role = employee
    ? `${ROLE_LABELS[employee.role]} · ${EMPLOYMENT_TYPE_LABELS[employee.employmentType]}`
    : "";
  const state = showState
    ? CoverUtils.shiftState(shift, now, {
        isCurrentUser: shift.employeeId === DEMO_USER.employeeId,
      })
    : null;
  const time = FormatUtils.formatTimeRange(
    new Date(shift.startAt),
    new Date(shift.endAt),
  );
  const breakText =
    shift.unpaidBreakMinutes > 0
      ? `${shift.unpaidBreakMinutes}m break`
      : "No break";
  const meta = `${breakText} · ${ShiftUtils.formatHours(ShiftUtils.paidMinutes(shift))}`;
  const overnight = !DateUtils.isSameDay(
    new Date(shift.startAt),
    new Date(shift.endAt),
  );

  return (
    <ShiftRow
      accessibilityLabel={[
        name,
        role,
        time,
        overnight
          ? `overnight, ends ${DateUtils.formatDayLabel(new Date(shift.endAt))}`
          : null,
        meta,
        state?.label,
      ]
        .filter(Boolean)
        .join(", ")}
      avatarColor={avatarColor}
      initials={initialsOf(name)}
      meta={meta}
      name={name}
      role={role}
      stateLabel={state?.label}
      stateTone={state?.tone}
      testID={`shift-row-${shift.id}`}
      time={time}
      onEdit={() => onEdit(shift.id)}
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  weekNav: { flexDirection: "row", alignItems: "center" },
  navButton: {
    width: 36,
    height: touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  weekLabel: {
    alignItems: "center",
    minHeight: touchTarget,
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
  },
  weekText: {
    fontFamily: fontFamily.semibold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
  },
  thisWeek: {
    fontFamily: fontFamily.semibold,
    fontSize: 11,
    lineHeight: 14,
    color: colors.accentText,
  },
  days: { paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: 10,
  },
  card: {
    gap: 14,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cardHeader: { flexDirection: "row", alignItems: "baseline", gap: spacing.sm },
  note: { textAlign: "center", marginTop: spacing.sm },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
