import { useCallback, useEffect, useRef } from "react"
import { LazyStore } from "@tauri-apps/plugin-store"
import { useShallow } from "zustand/react/shallow"
import { AppShell } from "@/components/app/app-shell"
import { useAppPluginViews } from "@/hooks/app/use-app-plugin-views"
import { usePluginContextActions } from "@/hooks/app/use-plugin-context-actions"
import { useProbe } from "@/hooks/app/use-probe"
import { useSettingsBootstrap } from "@/hooks/app/use-settings-bootstrap"
import { useSettingsDisplayActions } from "@/hooks/app/use-settings-display-actions"
import { useSettingsPluginActions } from "@/hooks/app/use-settings-plugin-actions"
import { useSettingsPluginList } from "@/hooks/app/use-settings-plugin-list"
import { useSettingsSystemActions } from "@/hooks/app/use-settings-system-actions"
import { useSettingsTheme } from "@/hooks/app/use-settings-theme"
import { useTrayIcon } from "@/hooks/app/use-tray-icon"
import { useAppPluginStore } from "@/stores/app-plugin-store"
import { useAppPreferencesStore } from "@/stores/app-preferences-store"
import { useAppUiStore } from "@/stores/app-ui-store"
import { isMacPlatform } from "@/lib/platform"

const TRAY_PROBE_DEBOUNCE_MS = 500
const UI_STATE_STORE_PATH = "ui-state.json"
const PANEL_PINNED_KEY = "panelPinned"

function App() {
  const { activeView, setActiveView, setPanelPinned } = useAppUiStore(
    useShallow((state) => ({
      activeView: state.activeView,
      setActiveView: state.setActiveView,
      setPanelPinned: state.setPanelPinned,
    }))
  )

  const { pluginsMeta, setPluginsMeta, pluginSettings, setPluginSettings } = useAppPluginStore(
    useShallow((state) => ({
      pluginsMeta: state.pluginsMeta,
      setPluginsMeta: state.setPluginsMeta,
      pluginSettings: state.pluginSettings,
      setPluginSettings: state.setPluginSettings,
    }))
  )

  const {
    autoUpdateInterval,
    setAutoUpdateInterval,
    themeMode,
    setThemeMode,
    displayMode,
    setDisplayMode,
    menubarIconStyle,
    setMenubarIconStyle,
    menubarMetric,
    setMenubarMetric,
    setMachineSettings,
    resetTimerDisplayMode,
    setResetTimerDisplayMode,
    setTimeFormatMode,
    setGlobalShortcut,
    setStartOnLogin,
    setPanelStayOpenWhenPinned,
    setPanelKeepOnTaskbar,
  } = useAppPreferencesStore(
    useShallow((state) => ({
      autoUpdateInterval: state.autoUpdateInterval,
      setAutoUpdateInterval: state.setAutoUpdateInterval,
      themeMode: state.themeMode,
      setThemeMode: state.setThemeMode,
      displayMode: state.displayMode,
      setDisplayMode: state.setDisplayMode,
      menubarIconStyle: state.menubarIconStyle,
      setMenubarIconStyle: state.setMenubarIconStyle,
      menubarMetric: state.menubarMetric,
      setMenubarMetric: state.setMenubarMetric,
      setMachineSettings: state.setMachineSettings,
      resetTimerDisplayMode: state.resetTimerDisplayMode,
      setResetTimerDisplayMode: state.setResetTimerDisplayMode,
      setTimeFormatMode: state.setTimeFormatMode,
      setGlobalShortcut: state.setGlobalShortcut,
      setStartOnLogin: state.setStartOnLogin,
      setPanelStayOpenWhenPinned: state.setPanelStayOpenWhenPinned,
      setPanelKeepOnTaskbar: state.setPanelKeepOnTaskbar,
    }))
  )

  const scheduleProbeTrayUpdateRef = useRef<() => void>(() => {})
  const handleProbeResult = useCallback(() => {
    scheduleProbeTrayUpdateRef.current()
  }, [])

  const {
    pluginStates,
    setLoadingForPlugins,
    setErrorForPlugins,
    startBatch,
    autoUpdateNextAt,
    setAutoUpdateNextAt,
    handleRetryPlugin,
    handleRefreshAll,
  } = useProbe({
    pluginSettings,
    autoUpdateInterval,
    onProbeResult: handleProbeResult,
  })

  const { scheduleTrayIconUpdate, traySettingsPreview } = useTrayIcon({
    pluginsMeta,
    pluginSettings,
    pluginStates,
    displayMode,
    menubarIconStyle,
    menubarMetric,
    activeView,
  })

  useEffect(() => {
    scheduleProbeTrayUpdateRef.current = () => {
      scheduleTrayIconUpdate("probe", TRAY_PROBE_DEBOUNCE_MS)
    }
  }, [scheduleTrayIconUpdate])

  useEffect(() => {
    if (isMacPlatform()) return

    const store = new LazyStore(UI_STATE_STORE_PATH)
    void store
      .get<boolean>(PANEL_PINNED_KEY)
      .then((value) => {
        if (value) {
          setPanelPinned(true)
        }
      })
      .catch(console.error)
  }, [setPanelPinned])

  const handleFirstRunSetupNeeded = useCallback(() => {
    setActiveView("settings")
  }, [setActiveView])

  const { applyStartOnLogin } = useSettingsBootstrap({
    setPluginSettings,
    setPluginsMeta,
    setAutoUpdateInterval,
    setThemeMode,
    setDisplayMode,
    setMenubarIconStyle,
    setMenubarMetric,
    setMachineSettings,
    setResetTimerDisplayMode,
    setTimeFormatMode,
    setGlobalShortcut,
    setStartOnLogin,
    setPanelStayOpenWhenPinned,
    setPanelKeepOnTaskbar,
    onFirstRunSetupNeeded: handleFirstRunSetupNeeded,
    setLoadingForPlugins,
    setErrorForPlugins,
    startBatch,
  })

  useSettingsTheme(themeMode)

  const {
    handleThemeModeChange,
    handleDisplayModeChange,
    handleResetTimerDisplayModeChange,
    handleResetTimerDisplayModeToggle,
    handleTimeFormatModeChange,
    handleMenubarIconStyleChange,
    handleMenubarMetricChange,
  } = useSettingsDisplayActions({
    setThemeMode,
    setDisplayMode,
    resetTimerDisplayMode,
    setResetTimerDisplayMode,
    setTimeFormatMode,
    setMenubarIconStyle,
    setMenubarMetric,
    scheduleTrayIconUpdate,
  })

  const {
    handleAutoUpdateIntervalChange,
    handleGlobalShortcutChange,
    handleMachineSettingsChange,
    handleStartOnLoginChange,
    handlePanelStayOpenWhenPinnedChange,
    handlePanelKeepOnTaskbarChange,
  } = useSettingsSystemActions({
    pluginSettings,
    setAutoUpdateInterval,
    setAutoUpdateNextAt,
    setGlobalShortcut,
    setMachineSettings,
    setStartOnLogin,
    setPanelStayOpenWhenPinned,
    setPanelKeepOnTaskbar,
    applyStartOnLogin,
  })

  const { handleReorder, handleToggle } = useSettingsPluginActions({
    pluginSettings,
    setPluginSettings,
    setLoadingForPlugins,
    setErrorForPlugins,
    startBatch,
    scheduleTrayIconUpdate,
  })

  const settingsPlugins = useSettingsPluginList({ pluginSettings, pluginsMeta })

  const { displayPlugins, navPlugins, selectedPlugin } = useAppPluginViews({
    activeView,
    setActiveView,
    pluginSettings,
    pluginsMeta,
    pluginStates,
  })

  const { handlePluginContextAction, isPluginRefreshAvailable } = usePluginContextActions({
    activeView,
    pluginSettings,
    pluginStates,
    setActiveView,
    setPluginSettings,
    handleRetryPlugin,
    scheduleTrayIconUpdate,
  })

  return (
    <AppShell
      onRefreshAll={handleRefreshAll}
      navPlugins={navPlugins}
      displayPlugins={displayPlugins}
      settingsPlugins={settingsPlugins}
      autoUpdateNextAt={autoUpdateNextAt}
      selectedPlugin={selectedPlugin}
      onPluginContextAction={handlePluginContextAction}
      isPluginRefreshAvailable={isPluginRefreshAvailable}
      onNavReorder={handleReorder}
      appContentProps={{
        onRetryPlugin: handleRetryPlugin,
        onReorder: handleReorder,
        onToggle: handleToggle,
        onAutoUpdateIntervalChange: handleAutoUpdateIntervalChange,
        onThemeModeChange: handleThemeModeChange,
        onDisplayModeChange: handleDisplayModeChange,
        onResetTimerDisplayModeChange: handleResetTimerDisplayModeChange,
        onResetTimerDisplayModeToggle: handleResetTimerDisplayModeToggle,
        onTimeFormatModeChange: handleTimeFormatModeChange,
        onMenubarIconStyleChange: handleMenubarIconStyleChange,
        onMenubarMetricChange: handleMenubarMetricChange,
        traySettingsPreview,
        onGlobalShortcutChange: handleGlobalShortcutChange,
        onMachineSettingsChange: handleMachineSettingsChange,
        onStartOnLoginChange: handleStartOnLoginChange,
        onPanelStayOpenWhenPinnedChange: handlePanelStayOpenWhenPinnedChange,
        onPanelKeepOnTaskbarChange: handlePanelKeepOnTaskbarChange,
      }}
    />
  )
}

export { App }
