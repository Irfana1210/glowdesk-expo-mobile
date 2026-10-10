/**
 * Labour cost estimates (brief §6, Screen 8). Pure functions.
 *
 *   Paid Hours = Shift Duration − Unpaid Breaks
 *   Base Labour Cost = Paid Hours × Hourly Rate
 *
 * This is a flat-rate estimate. Real Australian payroll applies award or enterprise agreement
 * rules, penalty rates, overtime, allowances and superannuation, none of which are modelled here.
 */
import { KpiUtils } from "@/features/dashboard/domain/kpis";
import { type Employee } from "@/features/employees/types";
import { DateUtils } from "@/features/roster/domain/dates";
import { ShiftUtils } from "@/features/roster/domain/shifts";
import { type Shift } from "@/features/roster/types";

import { type PayRate } from "../types";

export type EmployeeLabour = {
  cost: number;
  employee: Employee | undefined;
  employeeId: string;
  paidMinutes: number;
  shiftCount: number;
};

export type DayLabour = {
  cost: number;
  date: Date;
  paidMinutes: number;
};

export type WeeklyLabourSummary = {
  budget: number;
  /** Positive when under budget, negative when over. */
  budgetRemaining: number;
  byDay: Array<DayLabour>;
  byEmployee: Array<EmployeeLabour>;
  forecastSales: number;
  labourPercent: number | null;
  /** Employees with shifts but no applicable pay rate. Their cost is excluded and must be flagged. */
  missingRateEmployeeIds: Array<string>;
  totalCost: number;
  totalPaidMinutes: number;
};

export namespace LabourUtils {
  /** The rate in force on a date: the latest one whose effective date is on or before it. */
  export function rateOn(
    rates: Array<PayRate>,
    employeeId: string,
    date: Date,
  ): number | null {
    const key = DateUtils.toDateKey(date);
    const applicable = rates
      .filter((r) => r.employeeId === employeeId && r.effectiveFrom <= key)
      .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
    return applicable[0]?.baseHourlyRate ?? null;
  }

  /** Cost of one shift at the rate in force on the day it starts. Null when no rate exists. */
  export function shiftCost(
    shift: Shift,
    rates: Array<PayRate>,
  ): number | null {
    const rate = rateOn(rates, shift.employeeId, new Date(shift.startAt));
    return rate === null
      ? null
      : roundCents((ShiftUtils.paidMinutes(shift) / 60) * rate);
  }

  function roundCents(amount: number): number {
    return Math.round(amount * 100) / 100;
  }

  export function weeklyLabourSummary(input: {
    budget: number;
    employees: Array<Employee>;
    rates: Array<PayRate>;
    salesForecastByWeekday: Array<number>;
    shifts: Array<Shift>;
    weekStart: Date;
  }): WeeklyLabourSummary {
    const weekShifts = ShiftUtils.shiftsInWeek(input.shifts, input.weekStart);
    const employeesById = new Map(input.employees.map((e) => [e.id, e]));
    const missing = new Set<string>();
    const byEmployee = new Map<string, EmployeeLabour>();

    for (const shift of weekShifts) {
      const cost = shiftCost(shift, input.rates);
      if (cost === null) {
        missing.add(shift.employeeId);
      }
      const entry = byEmployee.get(shift.employeeId) ?? {
        employee: employeesById.get(shift.employeeId),
        employeeId: shift.employeeId,
        paidMinutes: 0,
        cost: 0,
        shiftCount: 0,
      };
      entry.paidMinutes += ShiftUtils.paidMinutes(shift);
      entry.cost = roundCents(entry.cost + (cost ?? 0));
      entry.shiftCount += 1;
      byEmployee.set(shift.employeeId, entry);
    }

    const byDay = DateUtils.weekDays(input.weekStart).map((date) => {
      const dayShifts = ShiftUtils.shiftsOnDay(weekShifts, date);
      return {
        date,
        paidMinutes: dayShifts.reduce(
          (sum, s) => sum + ShiftUtils.paidMinutes(s),
          0,
        ),
        cost: roundCents(
          dayShifts.reduce(
            (sum, s) => sum + (shiftCost(s, input.rates) ?? 0),
            0,
          ),
        ),
      };
    });

    const totalCost = roundCents(byDay.reduce((sum, d) => sum + d.cost, 0));
    const forecastSales = input.salesForecastByWeekday.reduce(
      (sum, v) => sum + v,
      0,
    );

    return {
      totalCost,
      totalPaidMinutes: byDay.reduce((sum, d) => sum + d.paidMinutes, 0),
      budget: input.budget,
      budgetRemaining: roundCents(input.budget - totalCost),
      forecastSales,
      labourPercent: KpiUtils.labourPercent(totalCost, forecastSales),
      byDay,
      byEmployee: [...byEmployee.values()].sort((a, b) => b.cost - a.cost),
      missingRateEmployeeIds: [...missing],
    };
  }
}
