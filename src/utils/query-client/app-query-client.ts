import { QueryClient } from "@tanstack/react-query";

import { MS_IN_DAY } from "@/constants/primitives";

import { StaleTimeMs } from "@/types/enums";

/**
 * Builds the app's QueryClient. A factory so tests get a fresh cache each render.
 *
 * Cached data is kept for a day, matching how long the saved cache on the device is trusted, so
 * the app opens with yesterday's data while offline. Mutations are not retried automatically: a
 * failed change is rolled back and explained instead.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      mutations: { retry: 0 },
      queries: { gcTime: MS_IN_DAY, retry: 2, staleTime: StaleTimeMs.Default },
    },
  });
}
