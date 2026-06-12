import { useCallback, useEffect, useRef } from "react"
import type { PluginOutput } from "@/lib/plugin-types"
import { useProbeEvents } from "@/hooks/use-probe-events"
import {
  type AutoUpdateIntervalMinutes,
  type MachineSettings,
  type PluginSettings,
} from "@/lib/settings"
import { buildRemoteUsageUrl } from "@/lib/remote-usage-url"
import { useProbeAutoUpdate } from "@/hooks/app/use-probe-auto-update"
import { useProbeRefreshActions } from "@/hooks/app/use-probe-refresh-actions"
import { useProbeState } from "@/hooks/app/use-probe-state"
import { useAppPreferencesStore } from "@/stores/app-preferences-store"

type UseProbeArgs = {
  pluginSettings: PluginSettings | null
  autoUpdateInterval: AutoUpdateIntervalMinutes
  onProbeResult?: () => void
}

function splitProbeIds(
  ids: string[],
  machineSettings: MachineSettings
): { localIds: string[]; remoteIds: string[] } {
  if (machineSettings.mode === "remote") {
    return { localIds: [], remoteIds: ids }
  }
  if (machineSettings.mode === "mixed") {
    const remoteSet = new Set(machineSettings.remotePluginIds)
    return {
      localIds: ids.filter((id) => !remoteSet.has(id)),
      remoteIds: ids.filter((id) => remoteSet.has(id)),
    }
  }
  return { localIds: ids, remoteIds: [] }
}

async function fetchRemoteUsage(baseUrl: string): Promise<PluginOutput[]> {
  const usageUrl = buildRemoteUsageUrl(baseUrl)
  if (!usageUrl) {
    throw new Error("Remote API base URL is not configured")
  }

  const response = await fetch(usageUrl)
  if (!response.ok) {
    throw new Error(`Remote API returned ${response.status}`)
  }

  const data = await response.json()
  if (!Array.isArray(data)) {
    throw new Error("Remote API returned invalid usage data")
  }
  return data.filter((item): item is PluginOutput => {
    return (
      typeof item === "object" &&
      item !== null &&
      typeof (item as PluginOutput).providerId === "string" &&
      Array.isArray((item as PluginOutput).lines)
    )
  })
}

export function useProbe({
  pluginSettings,
  autoUpdateInterval,
  onProbeResult,
}: UseProbeArgs) {
  const pluginSettingsRef = useRef(pluginSettings)
  useEffect(() => {
    pluginSettingsRef.current = pluginSettings
  }, [pluginSettings])

  const {
    pluginStates,
    pluginStatesRef,
    manualRefreshIdsRef,
    setLoadingForPlugins,
    setErrorForPlugins,
    handleProbeResult,
  } = useProbeState({ onProbeResult })

  const handleBatchComplete = useCallback(() => {}, [])

  const { startBatch: startLocalBatch } = useProbeEvents({
    onResult: handleProbeResult,
    onBatchComplete: handleBatchComplete,
  })

  const startBatch = useCallback(async (pluginIds?: string[]) => {
    const ids = pluginIds ?? pluginSettingsRef.current?.order ?? []
    const machineSettings = useAppPreferencesStore.getState().machineSettings
    const { localIds, remoteIds } = splitProbeIds(ids, machineSettings)
    const startedIds: string[] = []

    if (remoteIds.length > 0) {
      try {
        const outputs = await fetchRemoteUsage(machineSettings.remoteBaseUrl)
        const outputsById = new Map(outputs.map((output) => [output.providerId, output]))
        const missingIds: string[] = []
        for (const id of remoteIds) {
          const output = outputsById.get(id)
          if (output) {
            handleProbeResult(output)
            startedIds.push(id)
          } else {
            missingIds.push(id)
          }
        }
        if (missingIds.length > 0) {
          setErrorForPlugins(missingIds, "No remote data yet")
          startedIds.push(...missingIds)
        }
      } catch (error) {
        console.error("Failed to fetch remote usage:", error)
        setErrorForPlugins(remoteIds, "Remote machine unreachable")
        startedIds.push(...remoteIds)
      }
    }

    if (localIds.length > 0) {
      const result = await startLocalBatch(localIds)
      startedIds.push(...(result ?? localIds))
    }

    return startedIds
  }, [handleProbeResult, setErrorForPlugins, startLocalBatch])

  const isPluginLoading = useCallback(
    (id: string) => Boolean(pluginStatesRef.current[id]?.loading),
    [pluginStatesRef]
  )

  const {
    autoUpdateNextAt,
    setAutoUpdateNextAt,
    resetAutoUpdateSchedule,
  } = useProbeAutoUpdate({
    pluginSettings,
    autoUpdateInterval,
    setLoadingForPlugins,
    setErrorForPlugins,
    isPluginLoading,
    startBatch,
  })

  const { handleRetryPlugin, handleRefreshAll } = useProbeRefreshActions({
    pluginSettings,
    pluginStatesRef,
    manualRefreshIdsRef,
    resetAutoUpdateSchedule,
    setLoadingForPlugins,
    setErrorForPlugins,
    startBatch,
  })

  return {
    pluginStates,
    setLoadingForPlugins,
    setErrorForPlugins,
    startBatch,
    autoUpdateNextAt,
    setAutoUpdateNextAt,
    handleRetryPlugin,
    handleRefreshAll,
  }
}
