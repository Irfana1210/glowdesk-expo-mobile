/** Device preferences, persisted with expo-sqlite's key-value store like the other MVP state. */
import { Vibration } from 'react-native';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_KEYS, persistStorage } from '@/database/storage';

export interface NotificationPreferences {
  newOrders: boolean;
  lowStock: boolean;
  rosterChanges: boolean;
}

interface PreferencesState {
  vibrateOnScanError: boolean;
  notifications: NotificationPreferences;
  setVibrateOnScanError: (enabled: boolean) => void;
  setNotification: (key: keyof NotificationPreferences, enabled: boolean) => void;
  resetPreferences: () => void;
}

const DEFAULTS = {
  vibrateOnScanError: true,
  notifications: { newOrders: true, lowStock: true, rosterChanges: false },
};

export const PREFERENCES_STORAGE_KEY = STORAGE_KEYS.preferences;

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      ...DEFAULTS,
      setVibrateOnScanError: (enabled) => set({ vibrateOnScanError: enabled }),
      setNotification: (key, enabled) => set({ notifications: { ...get().notifications, [key]: enabled } }),
      resetPreferences: () => set(DEFAULTS),
    }),
    {
      name: PREFERENCES_STORAGE_KEY,
      version: 1,
      storage: persistStorage,
      partialize: (s) => ({ vibrateOnScanError: s.vibrateOnScanError, notifications: s.notifications }),
    },
  ),
);

/** Short vibration for a rejected scan, unless the user turned it off in Settings. */
export function signalScanError(): void {
  if (usePreferencesStore.getState().vibrateOnScanError) Vibration.vibrate(250);
}
