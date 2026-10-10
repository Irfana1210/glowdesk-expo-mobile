import {
  averageTransactionValue,
  calculateDashboardKpis,
  greetingFor,
  labourPercent,
  safeDivide,
  salesAchievementPercent,
} from "@/features/dashboard/domain/kpis";

import { DEMO_SALES_SUMMARY } from "@/mocks/sales";

describe("KPI formulas with the brief sample data", () => {
  it("calculates sales achievement as sales / target * 100", () => {
    expect(salesAchievementPercent(18_500, 20_000)).toBe(92.5);
  });

  it("calculates average transaction value as sales / transactions", () => {
    expect(averageTransactionValue(18_500, 215)).toBeCloseTo(86.0465, 4);
  });

  it("calculates labour percentage as labour spend / sales * 100", () => {
    expect(labourPercent(3_150, 18_500)).toBeCloseTo(17.027, 3);
  });

  it("builds the full KPI set from the demo summary", () => {
    const kpis = calculateDashboardKpis(DEMO_SALES_SUMMARY);
    expect(kpis).toMatchObject({
      sales: 18_500,
      target: 20_000,
      achievementPercent: 92.5,
      transactions: 215,
    });
    expect(kpis.remainingToTarget).toBe(1_500);
    expect(kpis.averageTransactionValue).toBeCloseTo(86.05, 2);
    expect(kpis.labourPercent).toBeCloseTo(17.03, 2);
  });
});

describe("zero and invalid denominators", () => {
  it("returns null instead of Infinity or NaN", () => {
    expect(safeDivide(10, 0)).toBeNull();
    expect(safeDivide(0, 0)).toBeNull();
    expect(safeDivide(Number.NaN, 5)).toBeNull();
    expect(safeDivide(5, Number.POSITIVE_INFINITY)).toBeNull();
  });

  it("has no achievement percentage when there is no target", () => {
    expect(salesAchievementPercent(18_500, 0)).toBeNull();
  });

  it("has no average transaction value before the first sale", () => {
    expect(averageTransactionValue(0, 0)).toBeNull();
  });

  it("has no labour percentage when there are no sales yet", () => {
    expect(labourPercent(3_150, 0)).toBeNull();
  });

  it("reports zero, not null, when the numerator is zero", () => {
    expect(salesAchievementPercent(0, 20_000)).toBe(0);
    expect(labourPercent(0, 18_500)).toBe(0);
  });

  it("handles a store with no trading yet", () => {
    const kpis = calculateDashboardKpis({
      ...DEMO_SALES_SUMMARY,
      salesAmount: 0,
      transactionCount: 0,
      labourSpend: 0,
      hourly: [],
    });
    expect(kpis).toMatchObject({
      achievementPercent: 0,
      averageTransactionValue: null,
      labourPercent: null,
      remainingToTarget: 20_000,
    });
  });

  it("never reports a negative amount remaining once the target is beaten", () => {
    expect(
      calculateDashboardKpis({ ...DEMO_SALES_SUMMARY, salesAmount: 25_000 })
        .remainingToTarget,
    ).toBe(0);
  });
});

describe("greetingFor", () => {
  it.each([
    [8, "Good morning"],
    [11, "Good morning"],
    [12, "Good afternoon"],
    [16, "Good afternoon"],
    [17, "Good evening"],
  ])("at %i:00 says %s", (hour, expected) => {
    expect(greetingFor(new Date(2026, 9, 10, hour, 0))).toBe(expected);
  });
});
