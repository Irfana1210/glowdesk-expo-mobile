import { useQuery } from '@tanstack/react-query';

import { fetchStoreSalesSummary } from '../api/salesApi';

export const salesQueryKeys = {
  summary: (storeId: string) => ['sales', 'summary', storeId] as const,
};

/** Sales are server state, so they live in TanStack Query rather than Zustand (brief §9). */
export function useStoreSalesSummary(storeId: string) {
  return useQuery({
    queryKey: salesQueryKeys.summary(storeId),
    queryFn: () => fetchStoreSalesSummary(storeId),
    staleTime: 60_000,
  });
}
