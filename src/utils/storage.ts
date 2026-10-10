/**
 * On-device persistence for MVP state (brief §9: "Persist MVP order state locally").
 *
 * Uses expo-sqlite's key-value store, an AsyncStorage-compatible API backed by SQLite.
 * The offline milestone (brief §10) adds proper tables here for cached orders, the pending
 * mutation queue and sync metadata, alongside these keys.
 *
 * Keys are versioned by the persist middleware. Never rename a key without a migration,
 * or saved progress on users' devices is silently dropped.
 */
import Storage from "expo-sqlite/kv-store";
import { createJSONStorage } from "zustand/middleware";

export const STORAGE_KEYS = {
  orders: "retailos.orders",
  roster: "retailos.roster",
  preferences: "retailos.preferences",
} as const;

/** JSON storage adapter for zustand's persist middleware. */
export const persistStorage = createJSONStorage(() => Storage);
