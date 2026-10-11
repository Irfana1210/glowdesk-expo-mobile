import { SALES_SUMMARY_CACHE_KEY } from "@/services/cache-keys";

import { useSafeQuery } from "@/hooks/query/use-safe-query";

import { StaleTimeMs } from "@/types/enums";

import { SalesService } from "../services/sales.service";

/** Sales are server state, so they live in TanStack Query rather than Zustand. */
export function useStoreSalesSummary(storeId: string) {
  return useSafeQuery({
    queryKey: [SALES_SUMMARY_CACHE_KEY, storeId],
    queryFn: () => SalesService.fetchStoreSalesSummary(storeId),
    staleTime: StaleTimeMs.SalesSummary,
  });
}
