/**
 * Fictional trading day for "RetailOS Melbourne Central", using the brief's sample figures.
 * Hourly sales add up exactly to the $18,500 daily total.
 */
import { type StoreSalesSummary } from "@/features/dashboard/types";

import { DEMO_STORE_ID, DEMO_STORE_NAME } from "./store";

const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
/** From the Dashboard mockup at 4:40 pm: trading so far, later hours still to come. */
const HOURLY_SALES = [
  1150, 1980, 2450, 3020, 3310, 2640, 2380, 1570, 0, 0, 0, 0,
];
const HOURLY_TARGET = [
  900, 1100, 1400, 1800, 2200, 2100, 1900, 1800, 1900, 2000, 1700, 1200,
];

export const DEMO_SALES_SUMMARY: StoreSalesSummary = {
  storeId: DEMO_STORE_ID,
  storeName: DEMO_STORE_NAME,
  businessDate: "2026-10-10",
  salesAmount: 18_500,
  salesTarget: 20_000,
  transactionCount: 215,
  labourSpend: 3_150,
  hourly: HOURS.map((hour, index) => ({
    hour,
    sales: HOURLY_SALES[index] ?? 0,
    target: HOURLY_TARGET[index] ?? 0,
  })),
};
