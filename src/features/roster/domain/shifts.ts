/**
 * Shift rules for the roster, shift editor and labour estimates. Pure functions.
 * Durations are measured between absolute instants, so overnight shifts and
 * daylight-saving changes are counted in real elapsed time.
 */
import { LOCALE } from "@/constants/locale";
import { MS_IN_MINUTE } from "@/constants/primitives";

import { FormatUtils } from "@/utils/format-utils";

import { type Employee } from "@/features/employees/types";

import { type Shift, type ShiftDraft } from "../types";
import { type DateKey, DateUtils } from "./dates";

type ShiftField = keyof ShiftDraft;
export type ShiftErrors = Partial<Record<ShiftField | "form", string>>;

export type ShiftValidationContext = {
  /** When editing, the shift being replaced is ignored for overlap checks. */
  editingShiftId?: string;
  employees: Array<Employee>;
  /** Current time. When given, a new shift (not an edit) may not start before it. */
  now?: Date;
  shifts: Array<Shift>;
  storeId: string;
};

export type TradingHours = {
  close: string;
  open: string;
};

type CoverageGap = {
  end: Date;
  start: Date;
};

export namespace ShiftUtils {
  /** Longer shifts are almost certainly data entry mistakes, for example a wrong "ends next day". */
  export const MAX_SHIFT_MINUTES = 14 * 60;

  function instant(iso: string): number | null {
    const time = Date.parse(iso);
    return Number.isNaN(time) ? null : time;
  }

  export function shiftDurationMinutes(
    shift: Pick<ShiftDraft, "startAt" | "endAt">,
  ): number {
    const start = instant(shift.startAt);
    const end = instant(shift.endAt);
    if (start === null || end === null) {
      return 0;
    }
    return Math.max(0, Math.round((end - start) / MS_IN_MINUTE));
  }

  /** Paid Hours = Shift Duration − Unpaid Breaks, in minutes. Never negative. */
  export function paidMinutes(shift: ShiftDraft): number {
    return Math.max(0, shiftDurationMinutes(shift) - shift.unpaidBreakMinutes);
  }

  export function paidHours(shift: ShiftDraft): number {
    return paidMinutes(shift) / 60;
  }

  export function isOvernight(
    shift: Pick<ShiftDraft, "startAt" | "endAt">,
  ): boolean {
    return !DateUtils.isSameDay(new Date(shift.startAt), new Date(shift.endAt));
  }

  /** Touching shifts (one ends 5pm, the next starts 5pm) do not overlap. */
  export function shiftsOverlap(
    a: Pick<ShiftDraft, "startAt" | "endAt">,
    b: Pick<ShiftDraft, "startAt" | "endAt">,
  ): boolean {
    const [aStart, aEnd, bStart, bEnd] = [
      a.startAt,
      a.endAt,
      b.startAt,
      b.endAt,
    ].map(instant);
    if (aStart == null || aEnd == null || bStart == null || bEnd == null) {
      return false;
    }
    return aStart < bEnd && bStart < aEnd;
  }

  export function formatShiftTimes(
    shift: Pick<ShiftDraft, "startAt" | "endAt">,
  ): string {
    return `${FormatUtils.formatClockTime(new Date(shift.startAt))} – ${FormatUtils.formatClockTime(new Date(shift.endAt))}`;
  }

  /** "7.5h", "8h", "0h" */
  export function formatHours(minutes: number): string {
    const hours = minutes / 60;
    return `${Number.isInteger(hours) ? hours.toFixed(0) : hours.toFixed(2).replace(/0$/, "")}h`;
  }

  /** Every shift editor rule. Returns an empty object when the shift is valid. */
  export function validateShift(
    draft: ShiftDraft,
    context: ShiftValidationContext,
  ): ShiftErrors {
    const errors: ShiftErrors = {};

    const employee = context.employees.find((e) => e.id === draft.employeeId);
    if (!draft.employeeId) {
      errors.employeeId = LOCALE.roster.validation.chooseEmployee;
    } else if (!employee) {
      errors.employeeId = LOCALE.roster.validation.employeeMissing;
    } else if (employee.storeId !== context.storeId) {
      errors.employeeId = LOCALE.roster.validation.employeeNotAssigned(
        employee.name,
      );
    } else if (!employee.active) {
      errors.employeeId = LOCALE.roster.validation.employeeInactive(
        employee.name,
      );
    }

    const start = instant(draft.startAt);
    const end = instant(draft.endAt);
    if (start === null) {
      errors.startAt = LOCALE.roster.validation.invalidStartTime;
    }
    if (end === null) {
      errors.endAt = LOCALE.roster.validation.invalidEndTime;
    }

    if (
      start !== null &&
      context.now &&
      !context.editingShiftId &&
      start < context.now.getTime()
    ) {
      errors.startAt = LOCALE.roster.validation.startsInPast;
    }

    if (start !== null && end !== null) {
      const duration = Math.round((end - start) / MS_IN_MINUTE);
      if (duration <= 0) {
        errors.endAt = LOCALE.roster.validation.endBeforeStart;
      } else if (duration > MAX_SHIFT_MINUTES) {
        errors.endAt = LOCALE.roster.validation.tooLong(MAX_SHIFT_MINUTES / 60);
      } else {
        if (
          !Number.isInteger(draft.unpaidBreakMinutes) ||
          draft.unpaidBreakMinutes < 0
        ) {
          errors.unpaidBreakMinutes = LOCALE.roster.validation.breakNotWhole;
        } else if (draft.unpaidBreakMinutes >= duration) {
          errors.unpaidBreakMinutes = LOCALE.roster.validation.breakTooLong;
        }
      }
    }

    if (!errors.employeeId && !errors.startAt && !errors.endAt && employee) {
      const clash = context.shifts.find(
        (s) =>
          s.employeeId === draft.employeeId &&
          s.id !== context.editingShiftId &&
          shiftsOverlap(s, draft),
      );
      if (clash) {
        errors.form = LOCALE.roster.validation.alreadyWorks(
          employee.name,
          formatShiftTimes(clash),
          DateUtils.formatDayLabel(new Date(clash.startAt)),
        );
      }
    }

    return errors;
  }

  export function hasErrors(errors: ShiftErrors): boolean {
    return Object.keys(errors).length > 0;
  }

  /** A shift belongs to the day it starts on, including overnight shifts. */
  export function shiftsOnDay(shifts: Array<Shift>, day: Date): Array<Shift> {
    const key: DateKey = DateUtils.toDateKey(day);
    return shifts
      .filter((s) => DateUtils.toDateKey(new Date(s.startAt)) === key)
      .sort((a, b) => a.startAt.localeCompare(b.startAt));
  }

  export function shiftsInWeek(
    shifts: Array<Shift>,
    weekStart: Date,
  ): Array<Shift> {
    const from = DateUtils.startOfDay(weekStart).getTime();
    const to = DateUtils.addDays(DateUtils.startOfDay(weekStart), 7).getTime();
    return shifts.filter((s) => {
      const t = Date.parse(s.startAt);
      return t >= from && t < to;
    });
  }

  export function totalPaidMinutes(shifts: Array<Shift>): number {
    return shifts.reduce((sum, s) => sum + paidMinutes(s), 0);
  }

  export const STORE_TRADING_HOURS: TradingHours = {
    open: "09:00",
    close: "21:00",
  };

  /**
   * Periods within trading hours when nobody is rostered on. Breaks are not modelled
   * because their timing is not scheduled, so this is a minimum-cover check.
   */
  export function coverageGaps(
    shifts: Array<Shift>,
    day: Date,
    hours: TradingHours = STORE_TRADING_HOURS,
  ): Array<CoverageGap> {
    const [openH = 0, openM = 0] = hours.open.split(":").map(Number);
    const [closeH = 0, closeM = 0] = hours.close.split(":").map(Number);
    const open = new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
      openH,
      openM,
    ).getTime();
    const close = new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
      closeH,
      closeM,
    ).getTime();

    const intervals = shifts
      .map((s) => [Date.parse(s.startAt), Date.parse(s.endAt)] as const)
      .filter(([s, e]) => e > open && s < close)
      .map(([s, e]) => [Math.max(s, open), Math.min(e, close)] as const)
      .sort((a, b) => a[0] - b[0]);

    const gaps: Array<CoverageGap> = [];
    let cursor = open;
    for (const [s, e] of intervals) {
      if (s > cursor) {
        gaps.push({ start: new Date(cursor), end: new Date(s) });
      }
      cursor = Math.max(cursor, e);
    }
    if (cursor < close) {
      gaps.push({ start: new Date(cursor), end: new Date(close) });
    }
    return gaps;
  }

  export function staffCount(shifts: Array<Shift>): number {
    return new Set(shifts.map((s) => s.employeeId)).size;
  }
}
