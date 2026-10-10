/** Mock sales API. This is the seam where a Supabase query against the `sales` table will plug in. */
import { MockUtils } from "@/utils/mock-utils";

import { DEMO_SALES_SUMMARY } from "@/mocks/sales";

import { type StoreSalesSummary } from "../types";

export namespace SalesService {
  export async function fetchStoreSalesSummary(
    storeId: string,
  ): Promise<StoreSalesSummary> {
    await MockUtils.simulateLatency();
    if (storeId !== DEMO_SALES_SUMMARY.storeId) {
      throw new Error(`No sales data for store ${storeId}.`);
    }
    return {
      ...DEMO_SALES_SUMMARY,
      businessDate: new Date().toISOString().slice(0, 10),
    };
  }
}
