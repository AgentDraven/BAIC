import { afterEach, describe, expect, it, vi } from "vitest"

const tauriState = vi.hoisted(() => ({
  isTauriMock: vi.fn(() => true),
}))

vi.mock("@tauri-apps/api/core", () => ({
  isTauri: tauriState.isTauriMock,
}))

import { getDataSourceLabel, getDataSourceMode } from "@/lib/data-source"

describe("data-source", () => {
  afterEach(() => {
    tauriState.isTauriMock.mockReset()
    tauriState.isTauriMock.mockReturnValue(true)
  })

  it("reports local mode inside the desktop app", () => {
    tauriState.isTauriMock.mockReturnValue(true)
    expect(getDataSourceMode()).toBe("local")
    expect(getDataSourceLabel()).toBe("Local")
  })

  it("reports remote mode in browser views", () => {
    tauriState.isTauriMock.mockReturnValue(false)
    expect(getDataSourceMode()).toBe("remote")
    expect(getDataSourceLabel()).toBe("Remote")
  })
})
