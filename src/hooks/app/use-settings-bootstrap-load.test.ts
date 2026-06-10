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
  loadMenubarMetricMock,
  loadResetTimerDisplayModeMock,
} = getBootstrapTestMocks()

describe("useSettingsBootstrap load fallbacks", () => {
  beforeEach(() => {
    resetBootstrapTestMocks()
  })

  it("falls back to default reset timer mode when loading fails", async () => {
    const resetModeError = new Error("reset timer mode unavailable")
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    loadResetTimerDisplayModeMock.mockRejectedValueOnce(resetModeError)
    const args = createBootstrapArgs()

    renderHook(() => useSettingsBootstrap(args))

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith(
        "Failed to load reset timer display mode:",
        resetModeError
      )
      expect(args.setResetTimerDisplayMode).toHaveBeenCalledWith("relative")
    })

    errorSpy.mockRestore()
  })

  it("applies the stored menubar metric", async () => {
    loadMenubarMetricMock.mockResolvedValueOnce("weekly")
    const args = createBootstrapArgs()

    renderHook(() => useSettingsBootstrap(args))

    await waitFor(() => {
      expect(args.setMenubarMetric).toHaveBeenCalledWith("weekly")
    })
  })

  it("falls back to default menubar metric when loading fails", async () => {
    const metricError = new Error("menubar metric unavailable")
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    loadMenubarMetricMock.mockRejectedValueOnce(metricError)
    const args = createBootstrapArgs()

    renderHook(() => useSettingsBootstrap(args))

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith("Failed to load menubar metric:", metricError)
      expect(args.setMenubarMetric).toHaveBeenCalledWith("default")
    })

    errorSpy.mockRestore()
  })
})