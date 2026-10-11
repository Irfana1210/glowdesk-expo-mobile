import { useEffect } from "react";

import NetInfo from "@react-native-community/netinfo";
import { onlineManager } from "@tanstack/react-query";

import { useMockNetworkStore } from "@/services/mock-api/mock-network.store";

/**
 * Tells TanStack Query whether the app is online, from the device connection and the
 * "Force offline" developer switch. While offline, queries pause and changes wait in the queue
 * instead of failing. Call once, in the root layout.
 */
export function useOnlineManager(): void {
  useEffect(() => {
    onlineManager.setEventListener((setOnline) => {
      // Unknown connection state counts as online until NetInfo reports otherwise.
      let deviceOnline = true;
      const update = () =>
        setOnline(deviceOnline && !useMockNetworkStore.getState().forceOffline);
      const unsubscribeDevice = NetInfo.addEventListener((state) => {
        deviceOnline = state.isConnected !== false;
        update();
      });
      const unsubscribeSwitch = useMockNetworkStore.subscribe(update);
      update();
      return () => {
        unsubscribeDevice();
        unsubscribeSwitch();
      };
    });
  }, []);
}
