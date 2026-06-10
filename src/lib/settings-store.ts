import { LazyStore } from "@tauri-apps/plugin-store";

const SETTINGS_STORE_PATH = "settings.json";

const store = new LazyStore(SETTINGS_STORE_PATH);

export function getSettingsStore(): LazyStore {
  return store;
}

type LegacyStoreWithDelete = {
  delete?: (key: string) => Promise<void>;
};

export async function deleteStoreKey(key: string): Promise<void> {
  const maybeDelete = (store as unknown as LegacyStoreWithDelete).delete;
  if (typeof maybeDelete === "function") {
    await maybeDelete.call(store, key);
    return;
  }
  await store.set(key, null);
}