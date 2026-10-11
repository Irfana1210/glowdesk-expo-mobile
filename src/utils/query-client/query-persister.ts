/**
 * Saves the TanStack Query cache on the device, including changes waiting for a connection.
 * After a restart the app shows the saved data straight away and resumes the waiting changes.
 */
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { type PersistQueryClientOptions } from "@tanstack/react-query-persist-client";

import { MS_IN_DAY } from "@/constants/primitives";

import { PAY_RATES_CACHE_KEY } from "@/services/cache-keys";

import { appStorage, STORAGE_KEYS } from "../storage";

/** Bump when a cached data shape changes, so old saved caches are discarded. */
const CACHE_VERSION = "1";

export const QUERY_PERSIST_OPTIONS: Omit<
  PersistQueryClientOptions,
  "queryClient"
> = {
  buster: CACHE_VERSION,
  dehydrateOptions: {
    // Pay rates are sensitive, so they are never written to the device.
    shouldDehydrateQuery: (query) =>
      query.state.status === "success" &&
      query.queryKey[0] !== PAY_RATES_CACHE_KEY,
    // The default keeps only paused mutations: the changes waiting for a connection.
  },
  maxAge: MS_IN_DAY,
  persister: createAsyncStoragePersister({
    key: STORAGE_KEYS.queryCache,
    storage: appStorage,
    throttleTime: 500,
  }),
};
