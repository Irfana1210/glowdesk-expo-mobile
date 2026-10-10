import { LOCALE } from "@/constants/locale";

const L = LOCALE.app.format;

export namespace FormatUtils {
  const MONTHS = L.months;

  export function pluralise(
    count: number,
    singular: string,
    plural = `${singular}s`,
  ): string {
    return `${count} ${count === 1 ? singular : plural}`;
  }

  function clockParts(date: Date): { suffix: string; time: string } {
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const displayHour = hours % 12 === 0 ? 12 : hours % 12;
    return {
      time: `${displayHour}:${minutes}`,
      suffix: hours < 12 ? L.am : L.pm,
    };
  }

  /** "9:47 am", device local time. Hand-rolled so output is identical on Hermes, web and Jest. */
  export function formatClockTime(date: Date): string {
    const { time, suffix } = clockParts(date);
    return `${time} ${suffix}`;
  }

  /** "5:00" without am/pm, for compact figures where the context is obvious. */
  export function formatClockCompact(date: Date): string {
    return clockParts(date).time;
  }

  /** Chart axis labels: "9am", "10", "11", "12pm", "1", … Only the first label and noon carry a suffix. */
  export function formatHourShort(hour: number, isFirst = false): string {
    const display = hour % 12 === 0 ? 12 : hour % 12;
    if (isFirst || hour === 12) {
      return `${display}${hour < 12 ? L.am : L.pm}`;
    }
    return String(display);
  }

  /** "9:00 am – 5:30 pm", or "12:00 – 8:30 pm" when both ends share am/pm. */
  export function formatTimeRange(start: Date, end: Date): string {
    const a = clockParts(start);
    const b = clockParts(end);
    return a.suffix === b.suffix
      ? `${a.time} – ${b.time} ${b.suffix}`
      : `${a.time} ${a.suffix} – ${b.time} ${b.suffix}`;
  }

  /** "53 min", "1h 5m", "3h 50m", "2h". Negative values are treated as zero. */
  export function formatDuration(totalMinutes: number): string {
    const minutes = Math.max(0, Math.round(totalMinutes));
    if (minutes < 60) {
      return L.minutes(minutes);
    }
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? L.hours(h) : L.hoursMinutes(h, m);
  }

  /** Coarse elapsed time for waiting orders: "12 min", "3h", "1 day", "2 days". */
  export function formatWaiting(totalMinutes: number): string {
    const minutes = Math.max(0, Math.round(totalMinutes));
    if (minutes < 60) {
      return L.minutes(minutes);
    }
    if (minutes < 24 * 60) {
      return L.hours(Math.floor(minutes / 60));
    }
    return L.days(Math.floor(minutes / (24 * 60)));
  }

  /** "SAT 10 OCT" style date for eyebrows (the eyebrow style uppercases it). */
  export function formatShortDate(date: Date): string {
    return `${L.weekdays[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}`;
  }

  function startOfDay(date: Date): number {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    ).getTime();
  }

  /** "Today, 9:47 am", "Yesterday, 4:10 pm" or "8 Oct, 3:15 pm". */
  export function formatOrderTime(iso: string, now: Date = new Date()): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return L.unknownTime;
    }

    const dayDiff = Math.round(
      (startOfDay(now) - startOfDay(date)) / 86_400_000,
    );
    const time = formatClockTime(date);
    if (dayDiff === 0) {
      return L.today(time);
    }
    if (dayDiff === 1) {
      return L.yesterday(time);
    }
    return `${date.getDate()} ${MONTHS[date.getMonth()]}, ${time}`;
  }

  export function formatOrderNumber(orderId: string): string {
    return `#${orderId}`;
  }

  function withThousands(integerDigits: string): string {
    return integerDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  /**
   * Australian dollars, e.g. "$18,500" or "$86.05". Hand-rolled rather than Intl so the
   * output is identical on Hermes, web and Jest.
   */
  export function formatCurrency(
    amount: number,
    { cents = false }: { cents?: boolean } = {},
  ): string {
    if (!Number.isFinite(amount)) {
      return L.notAvailable;
    }
    const sign = amount < 0 ? "-" : "";
    const fixed = Math.abs(amount).toFixed(cents ? 2 : 0);
    const [whole = "0", fraction] = fixed.split(".");
    return `${sign}$${withThousands(whole)}${fraction ? `.${fraction}` : ""}`;
  }

  /** Short form for chart labels, e.g. "$2.4K" or "$950". */
  export function formatCompactCurrency(amount: number): string {
    if (!Number.isFinite(amount)) {
      return L.notAvailable;
    }
    if (Math.abs(amount) < 1000) {
      return formatCurrency(amount);
    }
    const thousands = amount / 1000;
    const text = Number.isInteger(thousands)
      ? thousands.toFixed(0)
      : thousands.toFixed(1);
    return `$${text}K`;
  }

  /** Whole or one-decimal percentage. Null means the value could not be calculated. */
  export function formatPercent(value: number | null, decimals = 0): string {
    return value === null || !Number.isFinite(value)
      ? L.notAvailable
      : `${value.toFixed(decimals)}%`;
  }

  /** "9am", "12pm", "3pm". */
  export function formatHour(hour: number): string {
    const suffix = hour < 12 ? L.am : L.pm;
    const display = hour % 12 === 0 ? 12 : hour % 12;
    return `${display}${suffix}`;
  }
}
