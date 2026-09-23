import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { invoke } from "@tauri-apps/api/core"
import { PinnedOverlayBar } from "@/components/app/pinned-overlay-bar"
import { useAppPreferencesStore } from "@/stores/app-preferences-store"
import { useAppUiStore } from "@/stores/app-ui-store"
import type { DisplayPluginState } from "@/hooks/app/use-app-plugin-views"
import type { TraySettingsPreview } from "@/hooks/app/use-tray-icon"

const storeState = vi.hoisted(() => ({
  setMock: vi.fn(),
  saveMock: vi.fn(),
}))

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(() => Promise.resolve()),
}))

vi.mock("@tauri-apps/plugin-store", () => ({
  LazyStore: class {
    async set(key: string, value: unknown) {
      storeState.setMock(key, value)
    }
    async save() {
      storeState.saveMock()
    }
  },
}))

function plugin(id: string, name: string, used: number): DisplayPluginState {
  return {
    meta: {
      id,
      name,
      iconUrl: `${id}.svg`,
      lines: [],
      primaryCandidates: ["Usage"],
    },
    data: {
      providerId: id,
      displayName: name,
      iconUrl: `${id}.svg`,
      lines: [
        { type: "progress", label: "Usage", used, limit: 100, format: { kind: "percent" } },
      ],
    },
    loading: false,
    error: null,
    lastManualRefreshAt: null,
    lastUpdatedAt: null,
  }
}

const traySettingsPreview: TraySettingsPreview = {
  bars: [],
  providerBars: [],
  providerPercentText: "--%",
}

describe("PinnedOverlayBar", () => {
  beforeEach(() => {
    vi.mocked(invoke).mockClear()
    storeState.setMock.mockClear()
    storeState.saveMock.mockClear()
    useAppUiStore.getState().resetState()
    useAppPreferencesStore.getState().resetState()
    useAppUiStore.getState().setPanelPinned(true)
  })

  it("renders provider summaries and navigation controls", () => {
    render(
      <PinnedOverlayBar
        activeView="home"
        displayPlugins={[plugin("codex", "Codex", 42)]}
        traySettingsPreview={traySettingsPreview}
        onViewChange={vi.fn()}
        onRefreshAll={vi.fn()}
      />
    )

    expect(screen.getByText("Codex")).toBeInTheDocument()
    expect(screen.getByText("42%")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Settings" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Unpin panel" })).toBeInTheDocument()
  })

  it("unpins through Tauri and persists the state", async () => {
    render(
      <PinnedOverlayBar
        activeView="home"
        displayPlugins={[]}
        traySettingsPreview={traySettingsPreview}
        onViewChange={vi.fn()}
        onRefreshAll={vi.fn()}
      />
    )

    await userEvent.click(screen.getByRole("button", { name: "Unpin panel" }))

    expect(useAppUiStore.getState().panelPinned).toBe(false)
    expect(invoke).toHaveBeenCalledWith("set_panel_pinned", { pinned: false })
    expect(storeState.setMock).toHaveBeenCalledWith("panelPinned", false)
    expect(storeState.saveMock).toHaveBeenCalled()
  })

  it("marks providers routed to a remote machine", () => {
    useAppPreferencesStore.getState().setMachineSettings({
      mode: "mixed",
      remoteBaseUrl: "http://remote.example",
      remotePluginIds: ["codex"],
      setupComplete: true,
    })

    render(
      <PinnedOverlayBar
        activeView="home"
        displayPlugins={[plugin("codex", "Codex", 42)]}
        traySettingsPreview={traySettingsPreview}
        onViewChange={vi.fn()}
        onRefreshAll={vi.fn()}
      />
    )

    expect(screen.getByLabelText("Remote machine")).toBeInTheDocument()
  })
})
