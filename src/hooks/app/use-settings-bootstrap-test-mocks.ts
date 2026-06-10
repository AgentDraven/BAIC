import { vi } from "vitest"

const mocks = vi.hoisted(() => ({
  invokeMock: vi.fn(),
  isTauriMock: vi.fn(),
  isAutostartEnabledMock: vi.fn(),
  enableAutostartMock: vi.fn(),
  disableAutostartMock: vi.fn(),
  arePluginSettingsEqualMock: vi.fn(),
  getEnabledPluginIdsMock: vi.fn(),
  loadAutoUpdateIntervalMock: vi.fn(),
  loadDisplayModeMock: vi.fn(),
  loadGlobalShortcutMock: vi.fn(),
  loadMenubarIconStyleMock: vi.fn(),
  loadMenubarMetricMock: vi.fn(),
  loadPanelKeepOnTaskbarMock: vi.fn(),
  loadPanelStayOpenWhenPinnedMock: vi.fn(),
  loadPluginSettingsMock: vi.fn(),
  loadResetTimerDisplayModeMock: vi.fn(),
  loadStartOnLoginMock: vi.fn(),
  loadThemeModeMock: vi.fn(),
  loadTimeFormatModeMock: vi.fn(),
  migrateLegacyTraySettingsMock: vi.fn(),
  migrateWindsurfToDevinMock: vi.fn(),
  normalizePluginSettingsMock: vi.fn(),
  savePluginSettingsMock: vi.fn(),
}))

vi.mock("@tauri-apps/api/core", () => ({
  invoke: mocks.invokeMock,
  isTauri: mocks.isTauriMock,
}))

vi.mock("@tauri-apps/plugin-autostart", () => ({
  disable: mocks.disableAutostartMock,
  enable: mocks.enableAutostartMock,
  isEnabled: mocks.isAutostartEnabledMock,
}))

vi.mock("@/lib/settings", () => ({
  arePluginSettingsEqual: mocks.arePluginSettingsEqualMock,
  DEFAULT_AUTO_UPDATE_INTERVAL: 15,
  DEFAULT_DISPLAY_MODE: "left",
  DEFAULT_GLOBAL_SHORTCUT: null,
  DEFAULT_MENUBAR_ICON_STYLE: "provider",
  DEFAULT_MENUBAR_METRIC: "default",
  DEFAULT_RESET_TIMER_DISPLAY_MODE: "relative",
  DEFAULT_PANEL_KEEP_ON_TASKBAR: false,
  DEFAULT_PANEL_STAY_OPEN_WHEN_PINNED: false,
  DEFAULT_START_ON_LOGIN: false,
  DEFAULT_THEME_MODE: "system",
  DEFAULT_TIME_FORMAT_MODE: "auto",
  getEnabledPluginIds: mocks.getEnabledPluginIdsMock,
  loadAutoUpdateInterval: mocks.loadAutoUpdateIntervalMock,
  loadDisplayMode: mocks.loadDisplayModeMock,
  loadGlobalShortcut: mocks.loadGlobalShortcutMock,
  loadMenubarIconStyle: mocks.loadMenubarIconStyleMock,
  loadMenubarMetric: mocks.loadMenubarMetricMock,
  loadPanelKeepOnTaskbar: mocks.loadPanelKeepOnTaskbarMock,
  loadPanelStayOpenWhenPinned: mocks.loadPanelStayOpenWhenPinnedMock,
  loadPluginSettings: mocks.loadPluginSettingsMock,
  loadResetTimerDisplayMode: mocks.loadResetTimerDisplayModeMock,
  loadStartOnLogin: mocks.loadStartOnLoginMock,
  loadThemeMode: mocks.loadThemeModeMock,
  loadTimeFormatMode: mocks.loadTimeFormatModeMock,
  migrateLegacyTraySettings: mocks.migrateLegacyTraySettingsMock,
  migrateWindsurfToDevin: mocks.migrateWindsurfToDevinMock,
  normalizePluginSettings: mocks.normalizePluginSettingsMock,
  savePluginSettings: mocks.savePluginSettingsMock,
}))

export function getBootstrapTestMocks() {
  return mocks
}

export function createBootstrapArgs() {
  return {
    setPluginSettings: vi.fn(),
    setPluginsMeta: vi.fn(),
    setAutoUpdateInterval: vi.fn(),
    setThemeMode: vi.fn(),
    setDisplayMode: vi.fn(),
    setResetTimerDisplayMode: vi.fn(),
    setTimeFormatMode: vi.fn(),
    setGlobalShortcut: vi.fn(),
    setStartOnLogin: vi.fn(),
    setMenubarIconStyle: vi.fn(),
    setMenubarMetric: vi.fn(),
    setPanelStayOpenWhenPinned: vi.fn(),
    setPanelKeepOnTaskbar: vi.fn(),
    setLoadingForPlugins: vi.fn(),
    setErrorForPlugins: vi.fn(),
    startBatch: vi.fn().mockResolvedValue(undefined),
  }
}

export function resetBootstrapTestMocks() {
  const m = mocks
  m.invokeMock.mockReset()
  m.isTauriMock.mockReset()
  m.isAutostartEnabledMock.mockReset()
  m.enableAutostartMock.mockReset()
  m.disableAutostartMock.mockReset()
  m.arePluginSettingsEqualMock.mockReset()
  m.getEnabledPluginIdsMock.mockReset()
  m.loadAutoUpdateIntervalMock.mockReset()
  m.loadDisplayModeMock.mockReset()
  m.loadGlobalShortcutMock.mockReset()
  m.loadMenubarIconStyleMock.mockReset()
  m.loadMenubarMetricMock.mockReset()
  m.loadPanelKeepOnTaskbarMock.mockReset()
  m.loadPanelStayOpenWhenPinnedMock.mockReset()
  m.loadPluginSettingsMock.mockReset()
  m.loadResetTimerDisplayModeMock.mockReset()
  m.loadStartOnLoginMock.mockReset()
  m.loadThemeModeMock.mockReset()
  m.loadTimeFormatModeMock.mockReset()
  m.migrateLegacyTraySettingsMock.mockReset()
  m.migrateWindsurfToDevinMock.mockReset()
  m.normalizePluginSettingsMock.mockReset()
  m.savePluginSettingsMock.mockReset()

  m.isTauriMock.mockReturnValue(true)
  m.isAutostartEnabledMock.mockResolvedValue(true)
  m.invokeMock.mockResolvedValue([
    {
      id: "codex",
      name: "Codex",
      iconUrl: "/codex.svg",
      brandColor: "#000000",
      lines: [],
      primaryCandidates: [],
    },
  ])
  m.loadPluginSettingsMock.mockResolvedValue({ order: ["codex"], disabled: [] })
  m.normalizePluginSettingsMock.mockImplementation((stored) => stored)
  m.arePluginSettingsEqualMock.mockReturnValue(true)
  m.loadAutoUpdateIntervalMock.mockResolvedValue(15)
  m.loadThemeModeMock.mockResolvedValue("dark")
  m.loadDisplayModeMock.mockResolvedValue("used")
  m.loadResetTimerDisplayModeMock.mockResolvedValue("relative")
  m.loadTimeFormatModeMock.mockResolvedValue("auto")
  m.loadGlobalShortcutMock.mockResolvedValue("CommandOrControl+Shift+O")
  m.loadMenubarIconStyleMock.mockResolvedValue("provider")
  m.loadMenubarMetricMock.mockResolvedValue("default")
  m.loadStartOnLoginMock.mockResolvedValue(true)
  m.loadPanelStayOpenWhenPinnedMock.mockResolvedValue(false)
  m.loadPanelKeepOnTaskbarMock.mockResolvedValue(false)
  m.migrateLegacyTraySettingsMock.mockResolvedValue(undefined)
  m.migrateWindsurfToDevinMock.mockImplementation((settings) => settings)
  m.savePluginSettingsMock.mockResolvedValue(undefined)
  m.getEnabledPluginIdsMock.mockReturnValue(["codex"])
}