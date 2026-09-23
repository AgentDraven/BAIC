import "./use-settings-bootstrap-test-mocks"
import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useSettingsBootstrap } from "@/hooks/app/use-settings-bootstrap"
import {
  createBootstrapArgs,
  getBootstrapTestMocks,
  resetBootstrapTestMocks,
} from "@/hooks/app/use-settings-bootstrap-test-mocks"

const {
  disableAutostartMock,
  enableAutostartMock,
  arePluginSettingsEqualMock,
  getEnabledPluginIdsMock,
  invokeMock,
  loadPluginSettingsMock,
  migrateWindsurfToDevinMock,
  normalizePluginSettingsMock,
  savePluginSettingsMock,
} = getBootstrapTestMocks()

describe("useSettingsBootstrap autostart", () => {
  beforeEach(() => {
    resetBootstrapTestMocks()
  })

  it("disables autostart when applyStartOnLogin receives false", async () => {
    const args = createBootstrapArgs()
    const { result } = renderHook(() => useSettingsBootstrap(args))

    await result.current.applyStartOnLogin(false)

    expect(disableAutostartMock).toHaveBeenCalledTimes(1)
    expect(enableAutostartMock).not.toHaveBeenCalled()
  })
})

describe("useSettingsBootstrap migration", () => {
  beforeEach(() => {
    resetBootstrapTestMocks()
  })

  it("migrates windsurf settings before normalizing and saves the first-launch result", async () => {
    const args = createBootstrapArgs()
    const storedSettings = { order: ["windsurf"], disabled: [] }
    const migratedSettings = { order: ["devin"], disabled: [] }
    const availablePlugins = [
      {
        id: "devin",
        name: "Devin",
        iconUrl: "/devin.svg",
        brandColor: "#000000",
        lines: [],
        primaryCandidates: [],
      },
    ]

    invokeMock.mockResolvedValueOnce(availablePlugins)
    loadPluginSettingsMock.mockResolvedValueOnce(storedSettings)
    migrateWindsurfToDevinMock.mockReturnValueOnce(migratedSettings)
    normalizePluginSettingsMock.mockReturnValueOnce(migratedSettings)
    arePluginSettingsEqualMock.mockReturnValueOnce(false)
    getEnabledPluginIdsMock.mockReturnValueOnce(["devin"])

    renderHook(() => useSettingsBootstrap(args))

    await waitFor(() => {
      expect(normalizePluginSettingsMock).toHaveBeenCalledWith(
        migratedSettings,
        availablePlugins
      )
      expect(savePluginSettingsMock).toHaveBeenCalledWith(migratedSettings)
      expect(args.setPluginSettings).toHaveBeenCalledWith(migratedSettings)
      expect(args.startBatch).toHaveBeenCalledWith(["devin"])
    })
  })
})