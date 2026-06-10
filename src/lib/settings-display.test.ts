import { beforeEach, describe, expect, it } from "vitest"
import {
  DEFAULT_AUTO_UPDATE_INTERVAL,
  DEFAULT_DISPLAY_MODE,
  DEFAULT_MENUBAR_ICON_STYLE,
  DEFAULT_MENUBAR_METRIC,
  DEFAULT_RESET_TIMER_DISPLAY_MODE,
  DEFAULT_THEME_MODE,
  DEFAULT_TIME_FORMAT_MODE,
} from "@/lib/settings-types"
import {
  loadAutoUpdateInterval,
  loadDisplayMode,
  loadMenubarIconStyle,
  loadMenubarMetric,
  loadResetTimerDisplayMode,
  loadThemeMode,
  loadTimeFormatMode,
  saveAutoUpdateInterval,
  saveDisplayMode,
  saveMenubarIconStyle,
  saveMenubarMetric,
  saveResetTimerDisplayMode,
  saveThemeMode,
  saveTimeFormatMode,
} from "@/lib/settings-display"
import { getSettingsStoreMocks } from "@/test/settings-store-mock"

const { storeState, resetSettingsStoreMock } = getSettingsStoreMocks()

describe("settings display", () => {
  beforeEach(() => {
    resetSettingsStoreMock()
  })

  it("loads default auto-update interval when missing", async () => {
    await expect(loadAutoUpdateInterval()).resolves.toBe(DEFAULT_AUTO_UPDATE_INTERVAL)
  })

  it("loads stored auto-update interval", async () => {
    storeState.set("autoUpdateInterval", 30)
    await expect(loadAutoUpdateInterval()).resolves.toBe(30)
  })

  it("saves auto-update interval", async () => {
    await saveAutoUpdateInterval(5)
    await expect(loadAutoUpdateInterval()).resolves.toBe(5)
  })

  it("loads default theme mode when missing", async () => {
    await expect(loadThemeMode()).resolves.toBe(DEFAULT_THEME_MODE)
  })

  it("loads stored theme mode", async () => {
    storeState.set("themeMode", "dark")
    await expect(loadThemeMode()).resolves.toBe("dark")
  })

  it("saves theme mode", async () => {
    await saveThemeMode("light")
    await expect(loadThemeMode()).resolves.toBe("light")
  })

  it("falls back to default for invalid theme mode", async () => {
    storeState.set("themeMode", "invalid")
    await expect(loadThemeMode()).resolves.toBe(DEFAULT_THEME_MODE)
  })

  it("loads default display mode when missing", async () => {
    await expect(loadDisplayMode()).resolves.toBe(DEFAULT_DISPLAY_MODE)
  })

  it("loads stored display mode", async () => {
    storeState.set("displayMode", "left")
    await expect(loadDisplayMode()).resolves.toBe("left")
  })

  it("saves display mode", async () => {
    await saveDisplayMode("left")
    await expect(loadDisplayMode()).resolves.toBe("left")
  })

  it("falls back to default for invalid display mode", async () => {
    storeState.set("displayMode", "invalid")
    await expect(loadDisplayMode()).resolves.toBe(DEFAULT_DISPLAY_MODE)
  })

  it("loads default reset timer display mode when missing", async () => {
    await expect(loadResetTimerDisplayMode()).resolves.toBe(DEFAULT_RESET_TIMER_DISPLAY_MODE)
  })

  it("loads stored reset timer display mode", async () => {
    storeState.set("resetTimerDisplayMode", "absolute")
    await expect(loadResetTimerDisplayMode()).resolves.toBe("absolute")
  })

  it("saves reset timer display mode", async () => {
    await saveResetTimerDisplayMode("relative")
    await expect(loadResetTimerDisplayMode()).resolves.toBe("relative")
  })

  it("falls back to default for invalid reset timer display mode", async () => {
    storeState.set("resetTimerDisplayMode", "invalid")
    await expect(loadResetTimerDisplayMode()).resolves.toBe(DEFAULT_RESET_TIMER_DISPLAY_MODE)
  })

  it("loads default time format mode when missing", async () => {
    await expect(loadTimeFormatMode()).resolves.toBe(DEFAULT_TIME_FORMAT_MODE)
  })

  it("loads stored time format mode", async () => {
    storeState.set("timeFormatMode", "24h")
    await expect(loadTimeFormatMode()).resolves.toBe("24h")
  })

  it("saves time format mode", async () => {
    await saveTimeFormatMode("12h")
    await expect(loadTimeFormatMode()).resolves.toBe("12h")
  })

  it("falls back to default for invalid time format mode", async () => {
    storeState.set("timeFormatMode", "invalid")
    await expect(loadTimeFormatMode()).resolves.toBe(DEFAULT_TIME_FORMAT_MODE)
  })

  it("loads default menubar icon style when missing", async () => {
    await expect(loadMenubarIconStyle()).resolves.toBe(DEFAULT_MENUBAR_ICON_STYLE)
  })

  it("loads stored menubar icon style", async () => {
    storeState.set("menubarIconStyle", "bars")
    await expect(loadMenubarIconStyle()).resolves.toBe("bars")
  })

  it("saves menubar icon style", async () => {
    await saveMenubarIconStyle("bars")
    await expect(loadMenubarIconStyle()).resolves.toBe("bars")
  })

  it("loads stored menubar donut icon style", async () => {
    storeState.set("menubarIconStyle", "donut")
    await expect(loadMenubarIconStyle()).resolves.toBe("donut")
  })

  it("saves menubar donut icon style", async () => {
    await saveMenubarIconStyle("donut")
    await expect(loadMenubarIconStyle()).resolves.toBe("donut")
  })

  it("falls back to default for invalid menubar icon style", async () => {
    storeState.set("menubarIconStyle", "invalid")
    await expect(loadMenubarIconStyle()).resolves.toBe(DEFAULT_MENUBAR_ICON_STYLE)
  })

  it("loads default menubar metric when missing", async () => {
    await expect(loadMenubarMetric()).resolves.toBe(DEFAULT_MENUBAR_METRIC)
  })

  it("loads stored menubar metric", async () => {
    storeState.set("menubarMetric", "weekly")
    await expect(loadMenubarMetric()).resolves.toBe("weekly")
  })

  it("saves menubar metric", async () => {
    await saveMenubarMetric("weekly")
    await expect(loadMenubarMetric()).resolves.toBe("weekly")
  })

  it("falls back to default for invalid menubar metric", async () => {
    storeState.set("menubarMetric", "invalid")
    await expect(loadMenubarMetric()).resolves.toBe(DEFAULT_MENUBAR_METRIC)
  })
})