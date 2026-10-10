import { QueryClient } from "@tanstack/react-query";

import { StaleTimeMs } from "@/types/enums";

/** Builds the app's QueryClient. A factory so tests get a fresh cache each render. */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: 2, staleTime: StaleTimeMs.Default },
    },
  });
}
