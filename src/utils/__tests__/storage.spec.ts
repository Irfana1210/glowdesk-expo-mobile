import Storage from "expo-sqlite/kv-store";

import { appStorage, STORAGE_KEYS } from "@/utils/storage";

beforeEach(async () => {
  await Storage.removeItem(STORAGE_KEYS.session);
  await Storage.removeItem("retailos.session");
});

describe("appStorage", () => {
  it("moves data saved under the old RetailOS key to the Glowdesk key", async () => {
    await Storage.setItem("retailos.session", "saved-session");

    expect(await appStorage.getItem(STORAGE_KEYS.session)).toBe(
      "saved-session",
    );
    expect(await Storage.getItem(STORAGE_KEYS.session)).toBe("saved-session");
    expect(await Storage.getItem("retailos.session")).toBeNull();
  });

  it("prefers data already saved under the new key", async () => {
    await Storage.setItem(STORAGE_KEYS.session, "new");
    await Storage.setItem("retailos.session", "old");

    expect(await appStorage.getItem(STORAGE_KEYS.session)).toBe("new");
    expect(await Storage.getItem("retailos.session")).toBe("old");
  });

  it("returns null when nothing is saved under either key", async () => {
    expect(await appStorage.getItem(STORAGE_KEYS.session)).toBeNull();
  });
});
