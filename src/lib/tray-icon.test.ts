import { afterEach, describe, expect, it, vi } from "vitest"

const platformState = vi.hoisted(() => ({
  isMacPlatformMock: vi.fn(() => false),
}))

vi.mock("@/lib/platform", () => ({
  isMacPlatform: platformState.isMacPlatformMock,
}))

import { isTrayIconTemplate } from "@/lib/tray-icon"

describe("tray-icon", () => {
  afterEach(() => {
    platformState.isMacPlatformMock.mockReset()
    platformState.isMacPlatformMock.mockReturnValue(false)
  })

  it("uses template mode on macOS only", () => {
    platformState.isMacPlatformMock.mockReturnValue(true)
    expect(isTrayIconTemplate()).toBe(true)

    platformState.isMacPlatformMock.mockReturnValue(false)
    expect(isTrayIconTemplate()).toBe(false)
  })
})
