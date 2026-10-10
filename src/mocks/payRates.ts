/**
 * Fictional flat hourly rates. Rates rise on 1 July, when Australian award increases
 * usually apply, so each employee has a rate history. Casual rates include casual loading.
 */
import type { PayRate } from '@/features/labour/types';

const RATES: Record<string, [previous: number, current: number]> = {
  'emp-01': [37.2, 38.5],
  'emp-02': [31.4, 32.6],
  'emp-03': [36.35, 37.6],
  'emp-04': [36.35, 37.6],
  'emp-05': [29.1, 30.1],
  'emp-06': [28.4, 29.4],
};

export const MOCK_PAY_RATES: PayRate[] = Object.entries(RATES).flatMap(([employeeId, [previous, current]]) => [
  { employeeId, effectiveFrom: '2025-07-01', baseHourlyRate: previous },
  { employeeId, effectiveFrom: '2026-07-01', baseHourlyRate: current },
]);

/** Weekly labour budget for the store, in AUD. */
export const WEEKLY_LABOUR_BUDGET = 7_500;

/** Forecast sales by weekday, Monday first, used for the labour percentage. */
export const WEEKLY_SALES_FORECAST = [16_800, 17_200, 17_900, 19_600, 22_300, 26_800, 19_400];
