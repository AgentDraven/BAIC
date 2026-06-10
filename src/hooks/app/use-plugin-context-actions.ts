import { useCallback, useEffect, useRef } from "react"
import { REFRESH_COOLDOWN_MS, savePluginSettings } from "@/lib/settings"
import type { PluginContextAction } from "@/components/side-nav"
import type { PluginSettings } from "@/lib/settings"
import type { PluginState } from "@/hooks/app/types"

const TRAY_SETTINGS_DEBOUNCE_MS = 2000

type UsePluginContextActionsArgs = {
  activeView: string
  pluginSettings: PluginSettings | null
  pluginStates: Record<string, PluginState>
  setActiveView: (view: string) => void
  setPluginSettings: (value: PluginSettings | null) => void
  handleRetryPlugin: (pluginId: string) => void
  scheduleTrayIconUpdate: (reason: "probe" | "settings" | "init", debounceMs: number) => void
}

export function usePluginContextActions({
  activeView,
  pluginSettings,
  pluginStates,
  setActiveView,
  setPluginSettings,
  handleRetryPlugin,
  scheduleTrayIconUpdate,
}: UsePluginContextActionsArgs) {
  const pluginSettingsRef = useRef(pluginSettings)
  useEffect(() => {
    pluginSettingsRef.current = pluginSettings
  }, [pluginSettings])

  const handlePluginContextAction = useCallback(
    (pluginId: string, action: PluginContextAction) => {
      if (action === "reload") {
        handleRetryPlugin(pluginId)
        return
      }

      const currentSettings = pluginSettingsRef.current
      if (!currentSettings) return
      const alreadyDisabled = currentSettings.disabled.includes(pluginId)
      if (alreadyDisabled) return

      const nextSettings = {
        ...currentSettings,
        disabled: [...currentSettings.disabled, pluginId],
      }
      setPluginSettings(nextSettings)
      scheduleTrayIconUpdate("settings", TRAY_SETTINGS_DEBOUNCE_MS)
      void savePluginSettings(nextSettings).catch((error) => {
        console.error("Failed to save plugin toggle:", error)
      })

      if (activeView === pluginId) {
        setActiveView("home")
      }
    },
    [activeView, handleRetryPlugin, scheduleTrayIconUpdate, setActiveView, setPluginSettings]
  )

  const isPluginRefreshAvailable = useCallback(
    (pluginId: string) => {
      const pluginState = pluginStates[pluginId]
      if (!pluginState) return true
      if (pluginState.loading) return false
      if (!pluginState.lastManualRefreshAt) return true
      return Date.now() - pluginState.lastManualRefreshAt >= REFRESH_COOLDOWN_MS
    },
    [pluginStates]
  )

  return {
    handlePluginContextAction,
    isPluginRefreshAvailable,
  }
}