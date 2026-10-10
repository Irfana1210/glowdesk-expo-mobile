import { type Employee } from "@/features/employees/types";
import { LabourUtils } from "@/features/labour/domain/labour";
import { type PayRate } from "@/features/labour/types";
import { DateUtils } from "@/features/roster/domain/dates";
import { type Shift } from "@/features/roster/types";

import { MOCK_EMPLOYEES } from "@/mocks/employees";
import {
  MOCK_PAY_RATES,
  WEEKLY_LABOUR_BUDGET,
  WEEKLY_SALES_FORECAST,
} from "@/mocks/pay-rates";
import { createMockShifts } from "@/mocks/shifts";

const WEEK_START = new Date(2026, 9, 5);
const at = (day: number, h: number, m = 0) =>
  new Date(2026, 9, day, h, m).toISOString();
const shift = (overrides: Partial<Shift> = {}): Shift => ({
  id: "s1",
  storeId: "store",
  employeeId: "e1",
  startAt: at(6, 9),
  endAt: at(6, 17),
  unpaidBreakMinutes: 30,
  ...overrides,
});
const rates: Array<PayRate> = [
  { employeeId: "e1", effectiveFrom: "2025-07-01", baseHourlyRate: 30 },
  { employeeId: "e1", effectiveFrom: "2026-10-07", baseHourlyRate: 32 },
];
const employees: Array<Employee> = [
  {
    id: "e1",
    staffId: "RO9001",
    storeId: "store",
    name: "Test Person",
    role: "CASHIER",
    employmentType: "CASUAL",
    active: true,
  },
];

describe("rateOn", () => {
  it("uses the latest rate effective on the shift date", () => {
    expect(LabourUtils.rateOn(rates, "e1", new Date(2026, 9, 6))).toBe(30);
    expect(LabourUtils.rateOn(rates, "e1", new Date(2026, 9, 7))).toBe(32);
  });

  it("returns null before the first rate or for unknown employees", () => {
    expect(LabourUtils.rateOn(rates, "e1", new Date(2024, 0, 1))).toBeNull();
    expect(
      LabourUtils.rateOn(rates, "nobody", new Date(2026, 9, 7)),
    ).toBeNull();
  });
});

describe("shiftCost", () => {
  it("multiplies paid hours by the hourly rate", () => {
    // 8h shift − 30m break = 7.5 paid hours × $30
    expect(LabourUtils.shiftCost(shift(), rates)).toBe(225);
  });

  it("applies a rate change from its effective date", () => {
    expect(
      LabourUtils.shiftCost(
        shift({ startAt: at(7, 9), endAt: at(7, 17) }),
        rates,
      ),
    ).toBe(240);
  });

  it("costs an overnight shift at the rate of the day it starts", () => {
    expect(
      LabourUtils.shiftCost(
        shift({ startAt: at(6, 22), endAt: at(7, 6) }),
        rates,
      ),
    ).toBe(225);
  });

  it("returns null rather than zero when no rate exists", () => {
    expect(
      LabourUtils.shiftCost(shift({ employeeId: "nobody" }), rates),
    ).toBeNull();
  });
});

describe("weeklyLabourSummary", () => {
  const summarise = (shifts: Array<Shift>, budget = 1000) =>
    LabourUtils.weeklyLabourSummary({
      weekStart: WEEK_START,
      shifts,
      employees,
      rates,
      budget,
      salesForecastByWeekday: [1000, 1000, 1000, 1000, 1000, 1000, 1000],
    });

  it("totals cost by day and by employee, with budget and labour percentage", () => {
    const result = summarise([
      shift(),
      shift({ id: "s2", startAt: at(7, 9), endAt: at(7, 17) }),
    ]);
    expect(result.totalCost).toBe(465);
    expect(result.totalPaidMinutes).toBe(900);
    expect(result.budgetRemaining).toBe(535);
    expect(result.labourPercent).toBeCloseTo((465 / 7000) * 100, 5);
    expect(result.byDay.map((d) => d.cost)).toEqual([0, 225, 240, 0, 0, 0, 0]);
    expect(result.byEmployee).toEqual([
      expect.objectContaining({
        employeeId: "e1",
        cost: 465,
        paidMinutes: 900,
        shiftCount: 2,
      }),
    ]);
  });

  it("reports going over budget as a negative remainder", () => {
    expect(summarise([shift()], 200).budgetRemaining).toBe(-25);
  });

  it("ignores shifts outside the week", () => {
    expect(
      summarise([shift({ startAt: at(12, 9), endAt: at(12, 17) })]).totalCost,
    ).toBe(0);
  });

  it("flags employees without a pay rate instead of silently costing them at zero", () => {
    const result = summarise([shift({ employeeId: "ghost" })]);
    expect(result.missingRateEmployeeIds).toEqual(["ghost"]);
    expect(result.totalCost).toBe(0);
  });

  it("has no labour percentage without forecast sales", () => {
    const result = LabourUtils.weeklyLabourSummary({
      weekStart: WEEK_START,
      shifts: [shift()],
      employees,
      rates,
      budget: 0,
      salesForecastByWeekday: [],
    });
    expect(result.labourPercent).toBeNull();
  });

  it("costs the full demo week with every rostered employee rated", () => {
    const result = LabourUtils.weeklyLabourSummary({
      weekStart: WEEK_START,
      shifts: createMockShifts(DateUtils.addDays(WEEK_START, 2)),
      employees: MOCK_EMPLOYEES,
      rates: MOCK_PAY_RATES,
      budget: WEEKLY_LABOUR_BUDGET,
      salesForecastByWeekday: WEEKLY_SALES_FORECAST,
    });
    expect(result.missingRateEmployeeIds).toEqual([]);
    expect(result.totalPaidMinutes / 60).toBe(202.5);
    expect(result.totalCost).toBeGreaterThan(6_000);
    expect(result.totalCost).toBeLessThan(WEEKLY_LABOUR_BUDGET);
  });
});
