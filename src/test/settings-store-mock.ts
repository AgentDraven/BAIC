import { vi } from "vitest";

const mocks = vi.hoisted(() => {
  const storeState = new Map<string, unknown>();
  const storeDeleteMock = vi.fn();
  const storeSaveMock = vi.fn();

  class MockLazyStore {
    async get<T>(key: string): Promise<T | null> {
      if (!storeState.has(key)) return undefined as T | null;
      return storeState.get(key) as T | null;
    }
    async set<T>(key: string, value: T): Promise<void> {
      storeState.set(key, value);
    }
    async delete(key: string): Promise<void> {
      storeDeleteMock(key);
      storeState.delete(key);
    }
    async save(): Promise<void> {
      storeSaveMock();
    }
  }

  return {
    storeState,
    storeDeleteMock,
    storeSaveMock,
    MockLazyStore,
    resetSettingsStoreMock() {
      storeState.clear();
      storeDeleteMock.mockReset();
      storeSaveMock.mockReset();
    },
  };
});

vi.mock("@tauri-apps/plugin-store", () => ({
  LazyStore: mocks.MockLazyStore,
}));

export function getSettingsStoreMocks() {
  return mocks;
}