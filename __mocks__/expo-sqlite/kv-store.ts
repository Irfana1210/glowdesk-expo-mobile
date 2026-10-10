/** In-memory stand-in for expo-sqlite's key-value store, which needs native SQLite. */
const data = new Map<string, string>();

const storage = {
  clear: async () => data.clear(),
  getItem: async (key: string) => data.get(key) ?? null,
  removeItem: async (key: string) => {
    data.delete(key);
  },
  setItem: async (key: string, value: string) => {
    data.set(key, value);
  },
};

export const Storage = storage;

// eslint-disable-next-line no-restricted-exports
export default storage;
