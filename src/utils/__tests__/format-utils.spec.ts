import { LOCALE } from "@/constants/locale";

import { FormatUtils } from "@/utils/format-utils";

import { withEan13CheckDigit } from "@/mocks/products";

const L = LOCALE.app.format;

describe("format helpers", () => {
  const now = new Date(2026, 9, 10, 12, 0);

  it("formats 12-hour clock times", () => {
    expect(FormatUtils.formatClockTime(new Date(2026, 9, 10, 0, 5))).toBe(
      "12:05 am",
    );
    expect(FormatUtils.formatClockTime(new Date(2026, 9, 10, 9, 47))).toBe(
      "9:47 am",
    );
    expect(FormatUtils.formatClockTime(new Date(2026, 9, 10, 12, 0))).toBe(
      "12:00 pm",
    );
    expect(FormatUtils.formatClockTime(new Date(2026, 9, 10, 15, 30))).toBe(
      "3:30 pm",
    );
  });

  it("labels today, yesterday and older dates", () => {
    expect(
      FormatUtils.formatOrderTime(
        new Date(2026, 9, 10, 9, 47).toISOString(),
        now,
      ),
    ).toBe(L.today("9:47 am"));
    expect(
      FormatUtils.formatOrderTime(
        new Date(2026, 9, 9, 16, 10).toISOString(),
        now,
      ),
    ).toBe(L.yesterday("4:10 pm"));
    expect(
      FormatUtils.formatOrderTime(
        new Date(2026, 9, 8, 15, 15).toISOString(),
        now,
      ),
    ).toBe("8 Oct, 3:15 pm");
    expect(FormatUtils.formatOrderTime("not a date", now)).toBe(L.unknownTime);
  });

  it("pluralises counts", () => {
    expect(FormatUtils.pluralise(1, "item")).toBe("1 item");
    expect(FormatUtils.pluralise(0, "item")).toBe("0 items");
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
    expect(FormatUtils.formatCurrency(18500)).toBe("$18,500");
    expect(FormatUtils.formatCurrency(1234567)).toBe("$1,234,567");
    expect(FormatUtils.formatCurrency(0)).toBe("$0");
    expect(FormatUtils.formatCurrency(-3150)).toBe("-$3,150");
  });

  it("formats cents when asked", () => {
    expect(FormatUtils.formatCurrency(86.0465, { cents: true })).toBe("$86.05");
  });

  it("formats compact chart values", () => {
    expect(FormatUtils.formatCompactCurrency(2400)).toBe("$2.4K");
    expect(FormatUtils.formatCompactCurrency(2000)).toBe("$2K");
    expect(FormatUtils.formatCompactCurrency(950)).toBe("$950");
  });

  it("shows a dash for values that cannot be calculated", () => {
    expect(FormatUtils.formatPercent(null)).toBe(L.notAvailable);
    expect(FormatUtils.formatPercent(92.5)).toBe("93%");
    expect(FormatUtils.formatPercent(17.027, 1)).toBe("17.0%");
    expect(FormatUtils.formatCurrency(Number.NaN)).toBe(L.notAvailable);
  });

  it("formats hours", () => {
    expect([9, 12, 15, 0].map(FormatUtils.formatHour)).toEqual([
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
    expect(FormatUtils.formatTimeRange(at(12), at(20, 30))).toBe(
      "12:00 – 8:30 pm",
    );
    expect(FormatUtils.formatTimeRange(at(9), at(17, 30))).toBe(
      "9:00 am – 5:30 pm",
    );
  });

  it("formats durations and waiting times", () => {
    expect([53, 65, 230, 120, -4].map(FormatUtils.formatDuration)).toEqual([
      L.minutes(53),
      L.hoursMinutes(1, 5),
      L.hoursMinutes(3, 50),
      L.hours(2),
      L.minutes(0),
    ]);
    expect([12, 185, 1500, 3000].map(FormatUtils.formatWaiting)).toEqual([
      L.minutes(12),
      L.hours(3),
      L.days(1),
      L.days(2),
    ]);
  });

  it("formats short dates for eyebrows", () => {
    expect(FormatUtils.formatShortDate(at(9))).toBe("Sat 10 Oct");
  });
});

describe("formatHourShort", () => {
  it("labels the first hour and noon with am/pm and the rest with plain numbers", () => {
    const hours = [9, 10, 11, 12, 13, 20];
    expect(
      hours.map((h, i) => FormatUtils.formatHourShort(h, i === 0)),
    ).toEqual(["9am", "10", "11", "12pm", "1", "8"]);
  });
});
