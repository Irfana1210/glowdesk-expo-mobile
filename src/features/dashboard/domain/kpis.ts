/**
 * Dashboard KPI calculations (brief §6, Screen 1). Pure functions only.
 * Every ratio returns null instead of NaN or Infinity when its denominator is zero,
 * so the UI can show "not available" rather than a misleading number.
 */
import type { StoreSalesSummary } from '../types';

export function safeDivide(numerator: number, denominator: number): number | null {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return null;
  return numerator / denominator;
}

/** Daily Sales / Sales Target * 100 */
export function salesAchievementPercent(sales: number, target: number): number | null {
  const ratio = safeDivide(sales, target);
  return ratio === null ? null : ratio * 100;
}

/** Daily Sales / Transactions */
export function averageTransactionValue(sales: number, transactions: number): number | null {
  return safeDivide(sales, transactions);
}

/** Labour Spend / Daily Sales * 100 */
export function labourPercent(labourSpend: number, sales: number): number | null {
  const ratio = safeDivide(labourSpend, sales);
  return ratio === null ? null : ratio * 100;
}

export interface DashboardKpis {
  sales: number;
  target: number;
  achievementPercent: number | null;
  /** Target minus sales. Zero once the target is met. */
  remainingToTarget: number;
  transactions: number;
  averageTransactionValue: number | null;
  labourSpend: number;
  labourPercent: number | null;
}

export function calculateDashboardKpis(summary: StoreSalesSummary): DashboardKpis {
  return {
    sales: summary.salesAmount,
    target: summary.salesTarget,
    achievementPercent: salesAchievementPercent(summary.salesAmount, summary.salesTarget),
    remainingToTarget: Math.max(0, summary.salesTarget - summary.salesAmount),
    transactions: summary.transactionCount,
    averageTransactionValue: averageTransactionValue(summary.salesAmount, summary.transactionCount),
    labourSpend: summary.labourSpend,
    labourPercent: labourPercent(summary.labourSpend, summary.salesAmount),
  };
}

export function greetingFor(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
