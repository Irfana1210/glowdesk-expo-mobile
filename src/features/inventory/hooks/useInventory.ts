import { useQuery } from "@tanstack/react-query";

import { DEMO_STORE_ID } from "@/mocks/store";

import { fetchInventory } from "../api/inventoryApi";

export const inventoryQueryKeys = {
  list: (storeId: string) => ["inventory", storeId] as const,
};

/** Stock levels are server state, so they live in TanStack Query (brief §9). */
export function useInventory(storeId: string = DEMO_STORE_ID) {
  return useQuery({
    queryKey: inventoryQueryKeys.list(storeId),
    queryFn: () => fetchInventory(storeId),
    staleTime: 60_000,
  });
}
