/**
 * Fictional trading day for "Glowdesk Melbourne Central". Sales fill in hour by hour with the
 * real clock: nothing before opening, the hours traded so far during the day, and the full day
 * after close. At 4:40 pm it matches the dashboard's sample figures:
 * $18,500 in sales, 215 transactions and $3,150 labour spend.
 */
import { type StoreSalesSummary } from "@/features/dashboard/types";

import { DEMO_STORE_ID, DEMO_STORE_NAME } from "./store";

const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
/** A full day's sales. The first eight hours add up to the mockup's $18,500. */
const HOURLY_SALES = [
  1150, 1980, 2450, 3020, 3310, 2640, 2380, 1570, 1450, 1300, 1050, 600,
];
/** Adds up to the $20,000 daily target. */
const HOURLY_TARGET = [
  900, 1100, 1400, 1800, 2200, 2100, 1900, 1800, 1900, 2000, 1700, 1200,
];

/** The mockup's figures at 4:40 pm, used to scale transactions and labour to the sales so far. */
const MOCKUP_SALES = 18_500;
const MOCKUP_TRANSACTIONS = 215;
const MOCKUP_LABOUR = 3_150;
const MOCKUP_HOURS_TRADED = 8;

function dateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Today's trading so far at `now`. Hours that have not started yet show no sales. */
export function createSalesSummary(now: Date = new Date()): StoreSalesSummary {
  const hourly = HOURS.map((hour, index) => ({
    hour,
    sales: hour <= now.getHours() ? (HOURLY_SALES[index] ?? 0) : 0,
    target: HOURLY_TARGET[index] ?? 0,
  }));
  const salesAmount = hourly.reduce((sum, h) => sum + h.sales, 0);
  const hoursTraded = hourly.filter((h) => h.sales > 0).length;
  return {
    businessDate: dateKey(now),
    hourly,
    labourSpend: Math.round(
      (MOCKUP_LABOUR / MOCKUP_HOURS_TRADED) * hoursTraded,
    ),
    salesAmount,
    salesTarget: HOURLY_TARGET.reduce((sum, t) => sum + t, 0),
    storeId: DEMO_STORE_ID,
    storeName: DEMO_STORE_NAME,
    transactionCount: Math.round(
      (MOCKUP_TRANSACTIONS * salesAmount) / MOCKUP_SALES,
    ),
  };
}

/** The day as the dashboard mockup shows it: Saturday 10 October 2026, 4:40 pm. */
export const DEMO_SALES_SUMMARY = createSalesSummary(
  new Date(2026, 9, 10, 16, 40),
);
