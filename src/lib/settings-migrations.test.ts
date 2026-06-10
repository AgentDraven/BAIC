import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  migrateLegacyTraySettings,
  migrateWindsurfToDevin,
} from "@/lib/settings-migrations"
import { getSettingsStoreMocks } from "@/test/settings-store-mock"

const { storeState, storeDeleteMock, storeSaveMock, resetSettingsStoreMock } = getSettingsStoreMocks()

describe("settings migrations", () => {
  beforeEach(() => {
    resetSettingsStoreMock()
  })

  it("migrates enabled windsurf settings to enabled devin settings", () => {
    const result = migrateWindsurfToDevin({
      order: ["claude", "windsurf", "codex"],
      disabled: [],
    })

    expect(result).toEqual({
      order: ["claude", "devin", "codex"],
      disabled: [],
    })
  })

  it("keeps devin enabled when enabled windsurf conflicts with a stale disabled devin entry", () => {
    const result = migrateWindsurfToDevin({
      order: ["claude", "windsurf", "codex"],
      disabled: ["devin"],
    })

    expect(result).toEqual({
      order: ["claude", "devin", "codex"],
      disabled: [],
    })
  })

  it("migrates disabled windsurf settings to disabled devin settings", () => {
    const result = migrateWindsurfToDevin({
      order: ["windsurf", "claude"],
      disabled: ["windsurf"],
    })

    expect(result).toEqual({
      order: ["devin", "claude"],
      disabled: ["devin"],
    })
  })

  it("does not disable an existing devin entry when removing old windsurf settings", () => {
    const result = migrateWindsurfToDevin({
      order: ["windsurf", "devin", "claude"],
      disabled: ["windsurf"],
    })

    expect(result).toEqual({
      order: ["devin", "claude"],
      disabled: [],
    })
  })

  it("migrates and removes legacy tray settings keys", async () => {
    storeState.set("trayIconStyle", "provider")
    storeState.set("trayShowPercentage", false)

    await migrateLegacyTraySettings()

    expect(storeState.has("trayIconStyle")).toBe(false)
    expect(storeState.has("trayShowPercentage")).toBe(false)
  })

  it("migrates legacy trayIconStyle=bars to menubarIconStyle=bars when new key not set", async () => {
    storeState.set("trayIconStyle", "bars")

    await migrateLegacyTraySettings()

    expect(storeState.get("menubarIconStyle")).toBe("bars")
    expect(storeState.has("trayIconStyle")).toBe(false)
  })

  it("does not overwrite menubarIconStyle when already set during legacy migration", async () => {
    storeState.set("trayIconStyle", "bars")
    storeState.set("menubarIconStyle", "provider")

    await migrateLegacyTraySettings()

    expect(storeState.get("menubarIconStyle")).toBe("provider")
    expect(storeState.has("trayIconStyle")).toBe(false)
  })

  it("migrates legacy trayIconStyle=circle to menubarIconStyle=donut when new key not set", async () => {
    storeState.set("trayIconStyle", "circle")

    await migrateLegacyTraySettings()

    expect(storeState.get("menubarIconStyle")).toBe("donut")
    expect(storeState.has("trayIconStyle")).toBe(false)
  })

  it("does not set menubarIconStyle when legacy trayIconStyle is non-bars", async () => {
    storeState.set("trayIconStyle", "provider")

    await migrateLegacyTraySettings()

    expect(storeState.has("menubarIconStyle")).toBe(false)
    expect(storeState.has("trayIconStyle")).toBe(false)
  })

  it("skips legacy tray migration when keys are absent", async () => {
    await expect(migrateLegacyTraySettings()).resolves.toBeUndefined()
    expect(storeState.has("trayIconStyle")).toBe(false)
    expect(storeState.has("trayShowPercentage")).toBe(false)
    expect(storeDeleteMock).not.toHaveBeenCalled()
    expect(storeSaveMock).not.toHaveBeenCalled()
  })

  it("migrates when only one legacy tray key is present", async () => {
    storeState.set("trayShowPercentage", true)

    await migrateLegacyTraySettings()

    expect(storeState.has("trayShowPercentage")).toBe(false)
    expect(storeDeleteMock).toHaveBeenCalledWith("trayShowPercentage")
    expect(storeSaveMock).toHaveBeenCalledTimes(1)
  })

  it("falls back to nulling legacy keys if delete is unavailable", async () => {
    const { LazyStore } = await import("@tauri-apps/plugin-store")
    const prototype = LazyStore.prototype as { delete?: (key: string) => Promise<void> }
    const originalDelete = prototype.delete

    prototype.delete = undefined
    storeState.set("trayIconStyle", "provider")

    try {
      await migrateLegacyTraySettings()
    } finally {
      prototype.delete = originalDelete
    }

    expect(storeDeleteMock).not.toHaveBeenCalled()
    expect(storeState.get("trayIconStyle")).toBeNull()
    expect(storeSaveMock).toHaveBeenCalledTimes(1)
  })
})