import { type DateKey } from "@/features/roster/domain/dates";

/** Matches the `employee_pay_rates` table: a rate applies from its effective date until superseded. */
export type PayRate = {
  baseHourlyRate: number;
  effectiveFrom: DateKey;
  employeeId: string;
};
