/** Mock inventory API. The Supabase `inventory` + `products` join plugs in here. */
import { MockUtils } from "@/utils/mock-utils";

import { createMockInventory } from "@/mocks/inventory";
import { DEMO_STORE_ID } from "@/mocks/store";

import { type InventoryItem } from "../types";

export namespace InventoryService {
  export async function fetchInventory(
    storeId: string,
  ): Promise<Array<InventoryItem>> {
    await MockUtils.simulateLatency();
    if (storeId !== DEMO_STORE_ID) {
      throw new Error(`No inventory for store ${storeId}.`);
    }
    return createMockInventory();
  }
}
