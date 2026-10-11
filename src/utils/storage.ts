/**
 * On-device persistence for the app's saved state.
 *
 * Uses expo-sqlite's key-value store, an AsyncStorage-compatible API backed by SQLite.
 * The offline milestone adds proper tables here for cached orders, the pending
 * mutation queue and sync metadata, alongside these keys.
 *
 * Keys are versioned by the persist middleware. Never rename a key without a migration,
 * or saved progress on users' devices is silently dropped.
 */
import Storage from "expo-sqlite/kv-store";
import { createJSONStorage } from "zustand/middleware";

const KEY_PREFIX = "glowdesk.";
/** The app was called RetailOS before. Data saved under the old prefix is moved on first read. */
const LEGACY_KEY_PREFIX = "retailos.";

export const STORAGE_KEYS = {
  mockNetwork: `${KEY_PREFIX}mock-network`,
  mockServer: `${KEY_PREFIX}mock-server`,
  preferences: `${KEY_PREFIX}preferences`,
  queryCache: `${KEY_PREFIX}query-cache`,
  session: `${KEY_PREFIX}session`,
} as const;

/**
 * Keys from before orders and shifts moved to the mock API and TanStack Query. The mock server
 * deletes them once, so old demo data does not linger on devices.
 */
export const RETIRED_STORAGE_KEYS = [
  `${LEGACY_KEY_PREFIX}orders`,
  `${LEGACY_KEY_PREFIX}roster`,
];

/**
 * The key-value store, with a one-time move of each key from the RetailOS prefix to the Glowdesk
 * prefix. Everything saved on the device goes through this, so the rename loses nothing.
 */
export const appStorage = {
  getItem: async (key: string): Promise<string | null> => {
    const value = await Storage.getItem(key);
    if (value !== null || !key.startsWith(KEY_PREFIX)) {
      return value;
    }
    const legacyKey = LEGACY_KEY_PREFIX + key.slice(KEY_PREFIX.length);
    const legacy = await Storage.getItem(legacyKey);
    if (legacy !== null) {
      await Storage.setItem(key, legacy);
      await Storage.removeItem(legacyKey);
    }
    return legacy;
  },
  removeItem: (key: string): Promise<void> => Storage.removeItem(key),
  setItem: (key: string, value: string): Promise<void> =>
    Storage.setItem(key, value),
};

/** JSON storage adapter for zustand's persist middleware. */
export const persistStorage = createJSONStorage(() => appStorage);
