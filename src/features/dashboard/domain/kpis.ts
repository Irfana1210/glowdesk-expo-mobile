/**
 * Dashboard KPI calculations. Pure functions only.
 * Every ratio returns null instead of NaN or Infinity when its denominator is zero,
 * so the UI can show "not available" rather than a misleading number.
 */
import { LOCALE } from "@/constants/locale";

import { type StoreSalesSummary } from "../types";

export type DashboardKpis = {
  achievementPercent: number | null;
  averageTransactionValue: number | null;
  labourPercent: number | null;
  labourSpend: number;
  /** Target minus sales. Zero once the target is met. */
  remainingToTarget: number;
  sales: number;
  target: number;
  transactions: number;
};

export namespace KpiUtils {
  export function safeDivide(
    numerator: number,
    denominator: number,
  ): number | null {
    if (
      !Number.isFinite(numerator) ||
      !Number.isFinite(denominator) ||
      denominator === 0
    ) {
      return null;
    }
    return numerator / denominator;
  }

  /** Daily Sales / Sales Target * 100 */
  export function salesAchievementPercent(
    sales: number,
    target: number,
  ): number | null {
    const ratio = safeDivide(sales, target);
    return ratio === null ? null : ratio * 100;
  }

  /** Daily Sales / Transactions */
  export function averageTransactionValue(
    sales: number,
    transactions: number,
  ): number | null {
    return safeDivide(sales, transactions);
  }

  /** Labour Spend / Daily Sales * 100 */
  export function labourPercent(
    labourSpend: number,
    sales: number,
  ): number | null {
    const ratio = safeDivide(labourSpend, sales);
    return ratio === null ? null : ratio * 100;
  }

  export function calculateDashboardKpis(
    summary: StoreSalesSummary,
  ): DashboardKpis {
    return {
      sales: summary.salesAmount,
      target: summary.salesTarget,
      achievementPercent: salesAchievementPercent(
        summary.salesAmount,
        summary.salesTarget,
      ),
      remainingToTarget: Math.max(0, summary.salesTarget - summary.salesAmount),
      transactions: summary.transactionCount,
      averageTransactionValue: averageTransactionValue(
        summary.salesAmount,
        summary.transactionCount,
      ),
      labourSpend: summary.labourSpend,
      labourPercent: labourPercent(summary.labourSpend, summary.salesAmount),
    };
  }

  export function greetingFor(date: Date): string {
    const hour = date.getHours();
    if (hour < 12) {
      return LOCALE.dashboard.greeting.morning;
    }
    if (hour < 17) {
      return LOCALE.dashboard.greeting.afternoon;
    }
    return LOCALE.dashboard.greeting.evening;
  }
}
