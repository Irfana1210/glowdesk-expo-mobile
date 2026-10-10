/**
 * Live floor-cover rules for the dashboard and roster. Pure functions; `now` is always passed in.
 */
import { formatClockTime } from "@/utils/format-utils";

import { type Shift } from "../types";
import { atTime, isSameDay } from "./dates";
import { STORE_TRADING_HOURS, type TradingHours } from "./shifts";

/** Fewest people the store wants on the floor during trading hours. */
export const MIN_FLOOR_COVER = 3;

/** A break starting within this many minutes is flagged so someone can arrange cover. */
export const BREAK_COVER_NOTICE_MINUTES = 60;

const MINUTE = 60_000;
const t = (iso: string) => Date.parse(iso);

export type HourCover = {
  belowMinimum: boolean;
  count: number;
  /** Wall-clock hour, 0–23. */
  hour: number;
};

/** People rostered at any point in each trading hour of `day`. */
export function hourlyCover(
  shifts: Array<Shift>,
  day: Date,
  hours: TradingHours = STORE_TRADING_HOURS,
): Array<HourCover> {
  const open = atTime(day, hours.open);
  const close = atTime(day, hours.close);
  if (!open || !close) {
    return [];
  }
  const result: Array<HourCover> = [];
  for (let slot = open.getTime(); slot < close.getTime(); slot += 60 * MINUTE) {
    const slotEnd = slot + 60 * MINUTE;
    const count = shifts.filter(
      (s) => t(s.startAt) < slotEnd && slot < t(s.endAt),
    ).length;
    result.push({
      hour: new Date(slot).getHours(),
      count,
      belowMinimum: count < MIN_FLOOR_COVER,
    });
  }
  return result;
}

export function breakWindow(
  shift: Shift,
): { end: number; start: number } | null {
  if (!shift.breakStartAt || shift.unpaidBreakMinutes <= 0) {
    return null;
  }
  const start = t(shift.breakStartAt);
  return Number.isNaN(start)
    ? null
    : { start, end: start + shift.unpaidBreakMinutes * MINUTE };
}

export function isOnBreak(shift: Shift, now: Date): boolean {
  const window = breakWindow(shift);
  return (
    window !== null &&
    now.getTime() >= window.start &&
    now.getTime() < window.end
  );
}

/** Shifts in progress at `now`, excluding anyone on a scheduled break. */
export function staffOnFloor(shifts: Array<Shift>, now: Date): Array<Shift> {
  const time = now.getTime();
  return shifts.filter(
    (s) => t(s.startAt) <= time && time < t(s.endAt) && !isOnBreak(s, now),
  );
}

export type UpcomingBreak = {
  shift: Shift;
  startsAt: Date;
};

/** The next scheduled break today that has not started yet. */
export function nextBreak(
  shifts: Array<Shift>,
  now: Date,
): UpcomingBreak | null {
  const upcoming = shifts
    .map((shift) => ({ shift, window: breakWindow(shift) }))
    .filter(
      (b): b is { shift: Shift; window: { end: number; start: number } } =>
        b.window !== null &&
        b.window.start > now.getTime() &&
        isSameDay(new Date(b.window.start), now),
    )
    .sort((a, b) => a.window.start - b.window.start);
  const first = upcoming[0];
  return first
    ? { shift: first.shift, startsAt: new Date(first.window.start) }
    : null;
}

export function breakNeedsCover(upcoming: UpcomingBreak, now: Date): boolean {
  return (
    upcoming.startsAt.getTime() - now.getTime() <=
    BREAK_COVER_NOTICE_MINUTES * MINUTE
  );
}

export type ShiftPhase = "upcoming" | "active" | "finished";

export type ShiftProgress = {
  /** Minutes until the shift ends (active) or starts (upcoming). Zero when finished. */
  minutesRemaining: number;
  /** Share of the shift elapsed, 0–100. */
  percent: number;
  phase: ShiftPhase;
};

export function shiftProgress(shift: Shift, now: Date): ShiftProgress {
  const start = t(shift.startAt);
  const end = t(shift.endAt);
  const time = now.getTime();
  if (time < start) {
    return {
      phase: "upcoming",
      minutesRemaining: Math.ceil((start - time) / MINUTE),
      percent: 0,
    };
  }
  if (time >= end) {
    return { phase: "finished", minutesRemaining: 0, percent: 100 };
  }
  const total = end - start;
  return {
    phase: "active",
    minutesRemaining: Math.ceil((end - time) / MINUTE),
    percent: total > 0 ? ((time - start) / total) * 100 : 0,
  };
}

export type ShiftStateTone = "on" | "warn" | "off";

export type ShiftState = {
  label: string;
  tone: ShiftStateTone;
};

/** One-line live status for a roster row. Shown with a dot and text, never colour alone. */
export function shiftState(
  shift: Shift,
  now: Date,
  { isCurrentUser = false } = {},
): ShiftState {
  const progress = shiftProgress(shift, now);
  if (progress.phase === "finished") {
    return { label: "Finished", tone: "off" };
  }
  if (progress.phase === "upcoming") {
    return {
      label: `Starts ${formatClockTime(new Date(shift.startAt))}`,
      tone: "off",
    };
  }

  const window = breakWindow(shift);
  if (window && isOnBreak(shift, now)) {
    return {
      label: `On break until ${formatClockTime(new Date(window.end))}`,
      tone: "warn",
    };
  }
  if (window && window.start > now.getTime()) {
    const startsAt = new Date(window.start);
    if (breakNeedsCover({ shift, startsAt }, now)) {
      return {
        label: `Break at ${formatClockTime(startsAt)} · needs cover`,
        tone: "warn",
      };
    }
  }
  return {
    label: isCurrentUser ? "On the floor (you)" : "On the floor",
    tone: "on",
  };
}

/**
 * Order for today's roster list: people working or still to start come first, by start time;
 * people who have finished follow, most recently finished first. Other days sort by start time.
 */
export function sortShiftsForDay(
  shifts: Array<Shift>,
  day: Date,
  now: Date,
): Array<Shift> {
  const byStart = (a: Shift, b: Shift) => t(a.startAt) - t(b.startAt);
  if (!isSameDay(day, now)) {
    return [...shifts].sort(byStart);
  }
  const finished = (s: Shift) => t(s.endAt) <= now.getTime();
  const working = shifts.filter((s) => !finished(s)).sort(byStart);
  const done = shifts.filter(finished).sort((a, b) => t(b.endAt) - t(a.endAt));
  return [...working, ...done];
}

/** Hours (0–23) below the minimum, for the "Below minimum of 3 at 11 am" line. */
export function hoursBelowMinimum(cover: Array<HourCover>): Array<number> {
  return cover.filter((h) => h.belowMinimum).map((h) => h.hour);
}
