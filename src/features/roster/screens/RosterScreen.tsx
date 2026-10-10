import { type FC, useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";

import { useNow } from "@/hooks/useNow";

import {
  type Employee,
  EMPLOYMENT_TYPE_LABELS,
  ROLE_LABELS,
} from "@/features/employees/types";

import { Screen } from "@/components/layout/Screen";
import {
  AppText,
  EmptyState,
  PrimaryButton,
  ScreenTitle,
  ShiftRow,
} from "@/components/ui";

import { formatTimeRange } from "@/lib/format";
import { DEMO_USER } from "@/mocks/user";
import {
  colors,
  fontFamily,
  radius,
  spacing,
  swatches,
  touchTarget,
} from "@/theme";

import { FloorCoverChart } from "../components/FloorCoverChart";
import { WeekDaySelector } from "../components/WeekDaySelector";
import { hourlyCover, shiftState, sortShiftsForDay } from "../domain/cover";
import {
  addDays,
  formatDayLabel,
  formatWeekRangeShort,
  isSameDay,
  startOfWeek,
  toDateKey,
  weekDays,
} from "../domain/dates";
import {
  formatHours,
  paidMinutes,
  shiftsInWeek,
  shiftsOnDay,
  staffCount,
  totalPaidMinutes,
} from "../domain/shifts";
import { useRosterStore } from "../store/useRosterStore";
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

  const [weekStart, setWeekStart] = useState(() => startOfWeek(now));
  const [selected, setSelected] = useState(() => now);
  const isCurrentWeek = isSameDay(weekStart, startOfWeek(now));
  const isToday = isSameDay(selected, now);

  const goToWeek = (start: Date) => {
    setWeekStart(start);
    setSelected(isSameDay(start, startOfWeek(now)) ? now : start);
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
    () => totalPaidMinutes(shiftsInWeek(shifts, weekStart)),
    [shifts, weekStart],
  );
  const dayShifts = useMemo(
    () => sortShiftsForDay(shiftsOnDay(shifts, selected), selected, now),
    [shifts, selected, now],
  );
  const cover = useMemo(
    () => hourlyCover(shifts, selected),
    [shifts, selected],
  );

  const openShift = (shiftId: string) =>
    router.push({ pathname: "/roster/shift", params: { shiftId } });
  const addShift = () =>
    router.push({
      pathname: "/roster/shift",
      params: { date: toDateKey(selected) },
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
              onPress={() => goToWeek(addDays(weekStart, -7))}
            >
              <Ionicons color={colors.text} name="chevron-back" size={20} />
            </Pressable>
            <Pressable
              accessibilityHint={
                isCurrentWeek ? undefined : "Returns to this week"
              }
              accessibilityLabel={`Week of ${formatWeekRangeShort(weekStart)}${isCurrentWeek ? ", this week" : ""}`}
              accessibilityRole="button"
              disabled={isCurrentWeek}
              style={styles.weekLabel}
              testID="week-range"
              onPress={() => goToWeek(startOfWeek(now))}
            >
              <AppText style={styles.weekText}>
                {formatWeekRangeShort(weekStart)}
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
              onPress={() => goToWeek(addDays(weekStart, 7))}
            >
              <Ionicons color={colors.text} name="chevron-forward" size={20} />
            </Pressable>
          </View>
        }
        title="Roster"
      />

      <View style={styles.days}>
        <WeekDaySelector
          days={weekDays(weekStart)}
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
              Floor cover · {formatDayLabel(selected)}
            </AppText>
            <AppText color="textMuted" testID="day-totals" variant="supporting">
              {staffCount(dayShifts)} staff ·{" "}
              {formatHours(totalPaidMinutes(dayShifts)).replace("h", " h")}
            </AppText>
          </View>
          <FloorCoverChart cover={cover} />
        </View>

        {dayShifts.length === 0 ? (
          <EmptyState
            icon="calendar-clear-outline"
            message={`Nobody is rostered on ${formatDayLabel(selected)}.`}
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
          {formatHours(weekTotal).replace("h", " h")} scheduled this week. Hours
          only. Pay rates are visible to managers.
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
    ? shiftState(shift, now, {
        isCurrentUser: shift.employeeId === DEMO_USER.employeeId,
      })
    : null;
  const time = formatTimeRange(new Date(shift.startAt), new Date(shift.endAt));
  const breakText =
    shift.unpaidBreakMinutes > 0
      ? `${shift.unpaidBreakMinutes}m break`
      : "No break";
  const meta = `${breakText} · ${formatHours(paidMinutes(shift))}`;
  const overnight = !isSameDay(new Date(shift.startAt), new Date(shift.endAt));

  return (
    <ShiftRow
      accessibilityLabel={[
        name,
        role,
        time,
        overnight
          ? `overnight, ends ${formatDayLabel(new Date(shift.endAt))}`
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
