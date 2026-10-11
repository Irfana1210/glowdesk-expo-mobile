/** Mock inventory API. The Supabase `inventory` + `products` join plugs in here. */
import { MockServer } from "@/services/mock-api/mock-server";

import { createMockInventory } from "@/mocks/inventory";
import { DEMO_STORE_ID } from "@/mocks/store";

import { type InventoryItem } from "../types";

export namespace InventoryService {
  export function fetchInventory(
    storeId: string,
  ): Promise<Array<InventoryItem>> {
    return MockServer.respond(() => {
      if (storeId !== DEMO_STORE_ID) {
        throw new Error(`No inventory for store ${storeId}.`);
      }
      return createMockInventory();
    });
  }
}
