import { useSyncExternalStore } from "react";

import { onlineManager } from "@tanstack/react-query";

const subscribe = (onChange: () => void) => onlineManager.subscribe(onChange);
const isOnline = () => onlineManager.isOnline();

/** Whether the app is online, as TanStack Query sees it. Re-renders when it changes. */
export function useIsOnline(): boolean {
  return useSyncExternalStore(subscribe, isOnline);
}
