/** Pay rates API. The server only returns them to managers. */
import { MockServer } from "@/services/mock-api/mock-server";

import { type PayRate } from "../types";

export namespace PayRatesService {
  export function fetchPayRates(storeId: string): Promise<Array<PayRate>> {
    return MockServer.getPayRates(storeId);
  }
}
