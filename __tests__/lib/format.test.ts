import {
  formatClockTime,
  formatCompactCurrency,
  formatCurrency,
  formatDuration,
  formatHour,
  formatOrderTime,
  formatPercent,
  formatShortDate,
  formatTimeRange,
  formatWaiting,
  pluralise,
} from "@/lib/format";
import { withEan13CheckDigit } from "@/mocks/products";

describe("format helpers", () => {
  const now = new Date(2026, 9, 10, 12, 0);

  it("formats 12-hour clock times", () => {
    expect(formatClockTime(new Date(2026, 9, 10, 0, 5))).toBe("12:05 am");
    expect(formatClockTime(new Date(2026, 9, 10, 9, 47))).toBe("9:47 am");
    expect(formatClockTime(new Date(2026, 9, 10, 12, 0))).toBe("12:00 pm");
    expect(formatClockTime(new Date(2026, 9, 10, 15, 30))).toBe("3:30 pm");
  });

  it("labels today, yesterday and older dates", () => {
    expect(
      formatOrderTime(new Date(2026, 9, 10, 9, 47).toISOString(), now),
    ).toBe("Today, 9:47 am");
    expect(
      formatOrderTime(new Date(2026, 9, 9, 16, 10).toISOString(), now),
    ).toBe("Yesterday, 4:10 pm");
    expect(
      formatOrderTime(new Date(2026, 9, 8, 15, 15).toISOString(), now),
    ).toBe("8 Oct, 3:15 pm");
    expect(formatOrderTime("not a date", now)).toBe("Unknown time");
  });

  it("pluralises counts", () => {
    expect(pluralise(1, "item")).toBe("1 item");
    expect(pluralise(0, "item")).toBe("0 items");
  });
});

describe("withEan13CheckDigit", () => {
  it("computes a valid EAN-13 check digit", () => {
    // 4006381333931 is a well-known valid EAN-13.
    expect(withEan13CheckDigit("400638133393")).toBe("4006381333931");
  });
});

describe("currency and percentage formatting", () => {
  it("formats whole dollars with thousands separators", () => {
    expect(formatCurrency(18500)).toBe("$18,500");
    expect(formatCurrency(1234567)).toBe("$1,234,567");
    expect(formatCurrency(0)).toBe("$0");
    expect(formatCurrency(-3150)).toBe("-$3,150");
  });

  it("formats cents when asked", () => {
    expect(formatCurrency(86.0465, { cents: true })).toBe("$86.05");
  });

  it("formats compact chart values", () => {
    expect(formatCompactCurrency(2400)).toBe("$2.4K");
    expect(formatCompactCurrency(2000)).toBe("$2K");
    expect(formatCompactCurrency(950)).toBe("$950");
  });

  it("shows a dash for values that cannot be calculated", () => {
    expect(formatPercent(null)).toBe("—");
    expect(formatPercent(92.5)).toBe("93%");
    expect(formatPercent(17.027, 1)).toBe("17.0%");
    expect(formatCurrency(Number.NaN)).toBe("—");
  });

  it("formats hours", () => {
    expect([9, 12, 15, 0].map(formatHour)).toEqual([
      "9am",
      "12pm",
      "3pm",
      "12am",
    ]);
  });
});

describe("time ranges and durations", () => {
  const at = (h: number, m = 0) => new Date(2026, 9, 10, h, m);

  it("shares the am/pm suffix when both ends match", () => {
    expect(formatTimeRange(at(12), at(20, 30))).toBe("12:00 – 8:30 pm");
    expect(formatTimeRange(at(9), at(17, 30))).toBe("9:00 am – 5:30 pm");
  });

  it("formats durations and waiting times", () => {
    expect([53, 65, 230, 120, -4].map(formatDuration)).toEqual([
      "53 min",
      "1h 5m",
      "3h 50m",
      "2h",
      "0 min",
    ]);
    expect([12, 185, 1500, 3000].map(formatWaiting)).toEqual([
      "12 min",
      "3h",
      "1 day",
      "2 days",
    ]);
  });

  it("formats short dates for eyebrows", () => {
    expect(formatShortDate(at(9))).toBe("Sat 10 Oct");
  });
});
