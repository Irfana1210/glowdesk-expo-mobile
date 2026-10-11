/** Mock sales API. This is the seam where a Supabase query against the `sales` table will plug in. */
import { MockServer } from "@/services/mock-api/mock-server";

import { createSalesSummary } from "@/mocks/sales";
import { DEMO_STORE_ID } from "@/mocks/store";

import { type StoreSalesSummary } from "../types";

export namespace SalesService {
  export function fetchStoreSalesSummary(
    storeId: string,
  ): Promise<StoreSalesSummary> {
    return MockServer.respond(() => {
      if (storeId !== DEMO_STORE_ID) {
        throw new Error(`No sales data for store ${storeId}.`);
      }
      return createSalesSummary(new Date());
    });
  }
}
