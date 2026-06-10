import { beforeEach, describe, expect, it } from "vitest"
import {
  DEFAULT_GLOBAL_SHORTCUT,
  DEFAULT_PANEL_KEEP_ON_TASKBAR,
  DEFAULT_START_ON_LOGIN,
} from "@/lib/settings-types"
import {
  loadGlobalShortcut,
  loadPanelKeepOnTaskbar,
  loadStartOnLogin,
  saveGlobalShortcut,
  savePanelKeepOnTaskbar,
  saveStartOnLogin,
} from "@/lib/settings-system"
import { getSettingsStoreMocks } from "@/test/settings-store-mock"

const { storeState, resetSettingsStoreMock } = getSettingsStoreMocks()

describe("settings system", () => {
  beforeEach(() => {
    resetSettingsStoreMock()
  })

  it("loads default global shortcut when missing", async () => {
    await expect(loadGlobalShortcut()).resolves.toBe(DEFAULT_GLOBAL_SHORTCUT)
  })

  it("loads stored global shortcut values", async () => {
    storeState.set("globalShortcut", "CommandOrControl+Shift+O")
    await expect(loadGlobalShortcut()).resolves.toBe("CommandOrControl+Shift+O")

    storeState.set("globalShortcut", null)
    await expect(loadGlobalShortcut()).resolves.toBe(null)
  })

  it("falls back to default for invalid global shortcut values", async () => {
    storeState.set("globalShortcut", 1234)
    await expect(loadGlobalShortcut()).resolves.toBe(DEFAULT_GLOBAL_SHORTCUT)
  })

  it("saves global shortcut values", async () => {
    await saveGlobalShortcut("CommandOrControl+Shift+O")
    await expect(loadGlobalShortcut()).resolves.toBe("CommandOrControl+Shift+O")
  })

  it("loads default start on login when missing", async () => {
    await expect(loadStartOnLogin()).resolves.toBe(DEFAULT_START_ON_LOGIN)
  })

  it("loads stored start on login value", async () => {
    storeState.set("startOnLogin", true)
    await expect(loadStartOnLogin()).resolves.toBe(true)
  })

  it("saves start on login value", async () => {
    await saveStartOnLogin(true)
    await expect(loadStartOnLogin()).resolves.toBe(true)
  })

  it("falls back to default for invalid start on login value", async () => {
    storeState.set("startOnLogin", "invalid")
    await expect(loadStartOnLogin()).resolves.toBe(DEFAULT_START_ON_LOGIN)
  })

  it("loads default keep-on-taskbar when missing", async () => {
    await expect(loadPanelKeepOnTaskbar()).resolves.toBe(DEFAULT_PANEL_KEEP_ON_TASKBAR)
  })

  it("saves keep-on-taskbar value", async () => {
    await savePanelKeepOnTaskbar(true)
    await expect(loadPanelKeepOnTaskbar()).resolves.toBe(true)
  })

  it("falls back to default for invalid keep-on-taskbar value", async () => {
    storeState.set("panelKeepOnTaskbar", "invalid")
    await expect(loadPanelKeepOnTaskbar()).resolves.toBe(DEFAULT_PANEL_KEEP_ON_TASKBAR)
  })
})