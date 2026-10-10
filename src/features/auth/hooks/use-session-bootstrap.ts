import { useEffect } from "react";

import { useSessionStore } from "../store/session.store";

/**
 * Resolves the session status on launch. Persist rehydrates asynchronously; until it finishes
 * the status stays "loading" and the root layout keeps the splash screen up.
 */
export function useSessionBootstrap(): void {
  useEffect(() => {
    const { persist } = useSessionStore;
    if (persist.hasHydrated()) {
      useSessionStore.getState().finishHydration();
    }
    return persist.onFinishHydration(() =>
      useSessionStore.getState().finishHydration(),
    );
  }, []);
}
