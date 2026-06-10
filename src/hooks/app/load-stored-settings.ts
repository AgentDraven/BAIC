import { invoke, isTauri } from "@tauri-apps/api/core"
import {
  DEFAULT_AUTO_UPDATE_INTERVAL,
  DEFAULT_DISPLAY_MODE,
  DEFAULT_GLOBAL_SHORTCUT,
  DEFAULT_MENUBAR_ICON_STYLE,
  DEFAULT_MENUBAR_METRIC,
  DEFAULT_PANEL_KEEP_ON_TASKBAR,
  DEFAULT_PANEL_STAY_OPEN_WHEN_PINNED,
  DEFAULT_RESET_TIMER_DISPLAY_MODE,
  DEFAULT_START_ON_LOGIN,
  DEFAULT_THEME_MODE,
  DEFAULT_TIME_FORMAT_MODE,
  loadAutoUpdateInterval,
  loadDisplayMode,
  loadGlobalShortcut,
  loadMenubarIconStyle,
  loadMenubarMetric,
  loadPanelKeepOnTaskbar,
  loadPanelStayOpenWhenPinned,
  migrateLegacyTraySettings,
  loadResetTimerDisplayMode,
  loadStartOnLogin,
  loadThemeMode,
  loadTimeFormatMode,
  type AutoUpdateIntervalMinutes,
  type DisplayMode,
  type GlobalShortcut,
  type MenubarIconStyle,
  type MenubarMetric,
  type ResetTimerDisplayMode,
  type ThemeMode,
  type TimeFormatMode,
} from "@/lib/settings"

export type StoredSettings = {
  autoUpdateInterval: AutoUpdateIntervalMinutes
  themeMode: ThemeMode
  displayMode: DisplayMode
  resetTimerDisplayMode: ResetTimerDisplayMode
  timeFormatMode: TimeFormatMode
  globalShortcut: GlobalShortcut
  startOnLogin: boolean
  menubarIconStyle: MenubarIconStyle
  menubarMetric: MenubarMetric
  panelStayOpenWhenPinned: boolean
  panelKeepOnTaskbar: boolean
}

async function loadWithFallback<T>(
  label: string,
  fallback: T,
  loader: () => Promise<T>
): Promise<T> {
  try {
    return await loader()
  } catch (error) {
    console.error(`Failed to load ${label}:`, error)
    return fallback
  }
}

export async function loadStoredSettings(
  applyStartOnLogin: (value: boolean) => Promise<void>
): Promise<StoredSettings> {
  let storedInterval = DEFAULT_AUTO_UPDATE_INTERVAL
  storedInterval = await loadWithFallback(
    "auto-update interval",
    DEFAULT_AUTO_UPDATE_INTERVAL,
    loadAutoUpdateInterval
  )

  let storedThemeMode = DEFAULT_THEME_MODE
  storedThemeMode = await loadWithFallback("theme mode", DEFAULT_THEME_MODE, loadThemeMode)

  let storedDisplayMode = DEFAULT_DISPLAY_MODE
  storedDisplayMode = await loadWithFallback("display mode", DEFAULT_DISPLAY_MODE, loadDisplayMode)

  let storedResetTimerDisplayMode = DEFAULT_RESET_TIMER_DISPLAY_MODE
  storedResetTimerDisplayMode = await loadWithFallback(
    "reset timer display mode",
    DEFAULT_RESET_TIMER_DISPLAY_MODE,
    loadResetTimerDisplayMode
  )

  let storedTimeFormatMode = DEFAULT_TIME_FORMAT_MODE
  storedTimeFormatMode = await loadWithFallback(
    "time format mode",
    DEFAULT_TIME_FORMAT_MODE,
    loadTimeFormatMode
  )

  let storedGlobalShortcut = DEFAULT_GLOBAL_SHORTCUT
  storedGlobalShortcut = await loadWithFallback(
    "global shortcut",
    DEFAULT_GLOBAL_SHORTCUT,
    loadGlobalShortcut
  )

  let storedStartOnLogin = DEFAULT_START_ON_LOGIN
  storedStartOnLogin = await loadWithFallback(
    "start on login",
    DEFAULT_START_ON_LOGIN,
    loadStartOnLogin
  )

  try {
    await applyStartOnLogin(storedStartOnLogin)
  } catch (error) {
    console.error("Failed to apply start on login setting:", error)
  }

  try {
    await migrateLegacyTraySettings()
  } catch (error) {
    console.error("Failed to migrate legacy tray settings:", error)
  }

  let storedMenubarIconStyle = DEFAULT_MENUBAR_ICON_STYLE
  storedMenubarIconStyle = await loadWithFallback(
    "menubar icon style",
    DEFAULT_MENUBAR_ICON_STYLE,
    loadMenubarIconStyle
  )

  let storedMenubarMetric = DEFAULT_MENUBAR_METRIC
  storedMenubarMetric = await loadWithFallback(
    "menubar metric",
    DEFAULT_MENUBAR_METRIC,
    loadMenubarMetric
  )

  let storedPanelStayOpenWhenPinned = DEFAULT_PANEL_STAY_OPEN_WHEN_PINNED
  storedPanelStayOpenWhenPinned = await loadWithFallback(
    "panel stay-open setting",
    DEFAULT_PANEL_STAY_OPEN_WHEN_PINNED,
    loadPanelStayOpenWhenPinned
  )

  if (isTauri()) {
    try {
      await invoke("set_panel_stay_open_when_pinned", {
        stayOpen: storedPanelStayOpenWhenPinned,
      })
    } catch (error) {
      console.error("Failed to apply panel stay-open setting:", error)
    }
  }

  let storedPanelKeepOnTaskbar = DEFAULT_PANEL_KEEP_ON_TASKBAR
  storedPanelKeepOnTaskbar = await loadWithFallback(
    "panel keep-on-taskbar setting",
    DEFAULT_PANEL_KEEP_ON_TASKBAR,
    loadPanelKeepOnTaskbar
  )

  if (isTauri()) {
    try {
      await invoke("set_panel_keep_on_taskbar", {
        keep: storedPanelKeepOnTaskbar,
      })
    } catch (error) {
      console.error("Failed to apply panel keep-on-taskbar setting:", error)
    }
  }

  return {
    autoUpdateInterval: storedInterval,
    themeMode: storedThemeMode,
    displayMode: storedDisplayMode,
    resetTimerDisplayMode: storedResetTimerDisplayMode,
    timeFormatMode: storedTimeFormatMode,
    globalShortcut: storedGlobalShortcut,
    startOnLogin: storedStartOnLogin,
    menubarIconStyle: storedMenubarIconStyle,
    menubarMetric: storedMenubarMetric,
    panelStayOpenWhenPinned: storedPanelStayOpenWhenPinned,
    panelKeepOnTaskbar: storedPanelKeepOnTaskbar,
  }
}