import { PAY_RATES_CACHE_KEY } from "@/services/cache-keys";

import { useSafeQuery } from "@/hooks/query/use-safe-query";

import {
  selectIsManager,
  selectStoreId,
  useSessionStore,
} from "@/features/auth/store/session.store";

import { StaleTimeMs } from "@/types/enums";

import { PayRatesService } from "../services/pay-rates.service";

/** Pay rates, fetched only for managers. The server refuses everyone else as well. */
export function usePayRates() {
  const storeId = useSessionStore(selectStoreId);
  const isManager = useSessionStore(selectIsManager);
  return useSafeQuery({
    enabled: isManager,
    queryKey: [PAY_RATES_CACHE_KEY, storeId],
    queryFn: () => PayRatesService.fetchPayRates(storeId),
    staleTime: StaleTimeMs.ReferenceData,
  });
}
