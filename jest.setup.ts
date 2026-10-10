// Roster maths depends on local time and daylight saving. Pin the store's timezone so
// tests behave the same on every machine and in CI.
process.env.TZ = 'Australia/Melbourne';

import mockSafeAreaContext from 'react-native-safe-area-context/jest/mock';

jest.mock('react-native-safe-area-context', () => mockSafeAreaContext);

/** In-memory stand-in for expo-sqlite's key-value store, which needs native SQLite. */
jest.mock('expo-sqlite/kv-store', () => {
  const data = new Map<string, string>();
  const storage = {
    getItem: async (key: string) => data.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      data.set(key, value);
    },
    removeItem: async (key: string) => {
      data.delete(key);
    },
    clear: async () => data.clear(),
  };
  return { __esModule: true, default: storage, Storage: storage };
});
