/**
 * Simulated network conditions for the mock API, switched from Settings in development builds.
 * They let a demo show loading, offline and error handling without a real backend.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { persistStorage, STORAGE_KEYS } from "@/utils/storage";

type States = {
  /** Fail every request with a server error, to show error handling on demand. */
  failRequests: boolean;
  /** Treat the device as offline even when it has a connection. */
  forceOffline: boolean;
  /** Add a few seconds to every request so loading states are easy to see. */
  slowNetwork: boolean;
};

type Actions = {
  reset: () => void;
  setFailRequests: (enabled: boolean) => void;
  setForceOffline: (enabled: boolean) => void;
  setSlowNetwork: (enabled: boolean) => void;
};

const DEFAULTS: States = {
  failRequests: false,
  forceOffline: false,
  slowNetwork: false,
};

export const useMockNetworkStore = create<States & Actions>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setFailRequests: (failRequests) => set({ failRequests }),
      setForceOffline: (forceOffline) => set({ forceOffline }),
      setSlowNetwork: (slowNetwork) => set({ slowNetwork }),
      reset: () => set(DEFAULTS),
    }),
    {
      name: STORAGE_KEYS.mockNetwork,
      version: 1,
      storage: persistStorage,
      partialize: (s) => ({
        failRequests: s.failRequests,
        forceOffline: s.forceOffline,
        slowNetwork: s.slowNetwork,
      }),
    },
  ),
);
