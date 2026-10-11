import { INVENTORY_CACHE_KEY } from "@/services/cache-keys";

import { useSafeQuery } from "@/hooks/query/use-safe-query";

import { DEMO_STORE_ID } from "@/mocks/store";
import { StaleTimeMs } from "@/types/enums";

import { InventoryService } from "../services/inventory.service";

/** Stock levels are server state, so they live in TanStack Query. */
export function useInventory(storeId: string = DEMO_STORE_ID) {
  return useSafeQuery({
    queryKey: [INVENTORY_CACHE_KEY, storeId],
    queryFn: () => InventoryService.fetchInventory(storeId),
    staleTime: StaleTimeMs.Inventory,
  });
}
