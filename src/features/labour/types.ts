import type { DateKey } from '@/features/roster/domain/dates';

/** Brief §11 `employee_pay_rates`: a rate applies from its effective date until superseded. */
export interface PayRate {
  employeeId: string;
  effectiveFrom: DateKey;
  baseHourlyRate: number;
}
