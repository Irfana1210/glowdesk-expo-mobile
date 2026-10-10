/**
 * Local-calendar date helpers. Dates are handled in the device's timezone, which is
 * assumed to be the store's. Weeks start on Monday, as Australian retail rosters do.
 */

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "2026-10-06" in local time. Used as a stable key for a calendar day. */
export type DateKey = string;

export function toDateKey(date: Date): DateKey {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Local midnight for a date key. Returns null for malformed keys. */
export function fromDateKey(key: DateKey): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) {
    return null;
  }
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return toDateKey(date) === key ? date : null;
}

export function addDays(date: Date, days: number): Date {
  // Calendar arithmetic, not milliseconds, so DST changes never shift the day.
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + days,
    date.getHours(),
    date.getMinutes(),
  );
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Monday of the week containing `date`, at local midnight. */
export function startOfWeek(date: Date): Date {
  const day = startOfDay(date);
  const offset = (day.getDay() + 6) % 7; // Monday = 0
  return addDays(day, -offset);
}

export function weekDays(weekStart: Date): Array<Date> {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function isSameDay(a: Date, b: Date): boolean {
  return toDateKey(a) === toDateKey(b);
}

export function weekdayShort(date: Date): string {
  return WEEKDAYS[date.getDay()] ?? "";
}

/** "Tue 6 Oct" */
export function formatDayLabel(date: Date): string {
  return `${weekdayShort(date)} ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

/** "5 – 11 Oct 2026", "28 Sep – 4 Oct 2026" or "29 Dec 2025 – 4 Jan 2026". */
export function formatWeekRange(weekStart: Date): string {
  const end = addDays(weekStart, 6);
  const sameYear = weekStart.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && weekStart.getMonth() === end.getMonth();
  const startText = sameMonth
    ? `${weekStart.getDate()}`
    : `${weekStart.getDate()} ${MONTHS[weekStart.getMonth()]}${sameYear ? "" : ` ${weekStart.getFullYear()}`}`;
  return `${startText} – ${end.getDate()} ${MONTHS[end.getMonth()]} ${end.getFullYear()}`;
}

/** "5 – 11 Oct" or "28 Sep – 4 Oct", for compact headers. */
export function formatWeekRangeShort(weekStart: Date): string {
  const end = addDays(weekStart, 6);
  const sameMonth = weekStart.getMonth() === end.getMonth();
  const start = sameMonth
    ? `${weekStart.getDate()}`
    : `${weekStart.getDate()} ${MONTHS[weekStart.getMonth()]}`;
  return `${start} – ${end.getDate()} ${MONTHS[end.getMonth()]}`;
}

/** Local date at a wall-clock time, e.g. at(date, '09:30'). Returns null for malformed times. */
export function atTime(day: Date, time: string): Date | null {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) {
    return null;
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) {
    return null;
  }
  return new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    hours,
    minutes,
  );
}

/** "09:30" for a Date, in local time. */
export function toTimeValue(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}
