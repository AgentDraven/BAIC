import { useCallback, useEffect } from "react"
import { invoke, isTauri } from "@tauri-apps/api/core"
import {
  disable as disableAutostart,
  enable as enableAutostart,
  isEnabled as isAutostartEnabled,
} from "@tauri-apps/plugin-autostart"
import type { PluginMeta } from "@/lib/plugin-types"
import { loadStoredSettings } from "@/hooks/app/load-stored-settings"
import {
  arePluginSettingsEqual,
  getEnabledPluginIds,
  migrateWindsurfToDevin,
  loadPluginSettings,
  normalizePluginSettings,
  savePluginSettings,
  type AutoUpdateIntervalMinutes,
  type DisplayMode,
  type GlobalShortcut,
  type MenubarIconStyle,
  type MenubarMetric,
  type MachineSettings,
  type PluginSettings,
  type ResetTimerDisplayMode,
  type ThemeMode,
  type TimeFormatMode,
} from "@/lib/settings"

type UseSettingsBootstrapArgs = {
  setPluginSettings: (value: PluginSettings | null) => void
  setPluginsMeta: (value: PluginMeta[]) => void
  setAutoUpdateInterval: (value: AutoUpdateIntervalMinutes) => void
  setThemeMode: (value: ThemeMode) => void
  setDisplayMode: (value: DisplayMode) => void
  setResetTimerDisplayMode: (value: ResetTimerDisplayMode) => void
  setTimeFormatMode: (value: TimeFormatMode) => void
  setGlobalShortcut: (value: GlobalShortcut) => void
  setStartOnLogin: (value: boolean) => void
  setMenubarIconStyle: (value: MenubarIconStyle) => void
  setMenubarMetric: (value: MenubarMetric) => void
  setMachineSettings: (value: MachineSettings) => void
  setPanelStayOpenWhenPinned: (value: boolean) => void
  setPanelKeepOnTaskbar: (value: boolean) => void
  onFirstRunSetupNeeded: () => void
  setLoadingForPlugins: (ids: string[]) => void
  setErrorForPlugins: (ids: string[], error: string) => void
  startBatch: (pluginIds?: string[]) => Promise<string[] | undefined>
}

export function useSettingsBootstrap({
  setPluginSettings,
  setPluginsMeta,
  setAutoUpdateInterval,
  setThemeMode,
  setDisplayMode,
  setResetTimerDisplayMode,
  setTimeFormatMode,
  setGlobalShortcut,
  setStartOnLogin,
  setMenubarIconStyle,
  setMenubarMetric,
  setMachineSettings,
  setPanelStayOpenWhenPinned,
  setPanelKeepOnTaskbar,
  onFirstRunSetupNeeded,
  setLoadingForPlugins,
  setErrorForPlugins,
  startBatch,
}: UseSettingsBootstrapArgs) {
  const applyStartOnLogin = useCallback(async (value: boolean) => {
    if (!isTauri()) return
    const currentlyEnabled = await isAutostartEnabled()
    if (currentlyEnabled === value) return
    if (value) {
      await enableAutostart()
      return
    }
    await disableAutostart()
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadSettings = async () => {
      try {
        const availablePlugins = await invoke<PluginMeta[]>("list_plugins")
        if (!isMounted) return
        setPluginsMeta(availablePlugins)

        const storedSettings = await loadPluginSettings()
        const migratedSettings = migrateWindsurfToDevin(storedSettings)
        const normalized = normalizePluginSettings(migratedSettings, availablePlugins)
        if (!arePluginSettingsEqual(storedSettings, normalized)) {
          await savePluginSettings(normalized)
        }

        const stored = await loadStoredSettings(applyStartOnLogin)

        if (isMounted) {
          setPluginSettings(normalized)
          setAutoUpdateInterval(stored.autoUpdateInterval)
          setThemeMode(stored.themeMode)
          setDisplayMode(stored.displayMode)
          setResetTimerDisplayMode(stored.resetTimerDisplayMode)
          setTimeFormatMode(stored.timeFormatMode)
          setGlobalShortcut(stored.globalShortcut)
          setStartOnLogin(stored.startOnLogin)
          setMenubarIconStyle(stored.menubarIconStyle)
          setMenubarMetric(stored.menubarMetric)
          setMachineSettings(stored.machineSettings)
          if (!stored.machineSettings.setupComplete) {
            onFirstRunSetupNeeded()
          }
          setPanelStayOpenWhenPinned(stored.panelStayOpenWhenPinned)
          setPanelKeepOnTaskbar(stored.panelKeepOnTaskbar)

          const enabledIds = getEnabledPluginIds(normalized)
          setLoadingForPlugins(enabledIds)
          try {
            await startBatch(enabledIds)
          } catch (error) {
            console.error("Failed to start probe batch:", error)
            if (isMounted) {
              setErrorForPlugins(enabledIds, "Failed to start probe")
            }
          }
        }
      } catch (e) {
        console.error("Failed to load plugin settings:", e)
      }
    }

    loadSettings()
    return () => {
      isMounted = false
    }
  }, [
    applyStartOnLogin,
    setAutoUpdateInterval,
    setDisplayMode,
    setErrorForPlugins,
    setGlobalShortcut,
    setLoadingForPlugins,
    setMenubarIconStyle,
    setMenubarMetric,
    setMachineSettings,
    onFirstRunSetupNeeded,
    setPanelKeepOnTaskbar,
    setPanelStayOpenWhenPinned,
    setPluginSettings,
    setPluginsMeta,
    setResetTimerDisplayMode,
    setStartOnLogin,
    setThemeMode,
    setTimeFormatMode,
    startBatch,
  ])

  return { applyStartOnLogin }
}
