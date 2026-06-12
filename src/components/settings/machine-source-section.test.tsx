import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { MachineSourceSection } from "@/components/settings/machine-source-section"
import type { MachineSettings } from "@/lib/settings"

const baseSettings: MachineSettings = {
  mode: "local",
  remoteBaseUrl: "",
  remotePluginIds: [],
  setupComplete: false,
}

const plugins = [
  { id: "claude", name: "Claude", enabled: true },
  { id: "codex", name: "Codex", enabled: true },
]

function renderSection(settings: MachineSettings = baseSettings) {
  const onChange = vi.fn()
  render(
    <MachineSourceSection
      settings={settings}
      plugins={plugins}
      onChange={onChange}
    />
  )
  return { onChange }
}

describe("MachineSourceSection", () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it("shows remote setup guidance and copyable tunnel command", async () => {
    const writeText = vi.fn(() => Promise.resolve())
    vi.stubGlobal("navigator", { clipboard: { writeText } })

    renderSection({
      ...baseSettings,
      mode: "remote",
      remoteBaseUrl: "http://remote-machine:6737",
    })

    expect(screen.getByText("Remote setup")).toBeInTheDocument()
    expect(screen.getByText("ssh -L 6737:127.0.0.1:6736 user@remote-machine")).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "Copy SSH tunnel command" }))

    expect(writeText).toHaveBeenCalledWith("ssh -L 6737:127.0.0.1:6736 user@remote-machine")
  })

  it("tests a reachable remote usage endpoint", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ providerId: "claude", lines: [] }]),
        })
      )
    )

    renderSection({
      ...baseSettings,
      mode: "remote",
      remoteBaseUrl: "http://remote-machine:6737/",
    })

    await userEvent.click(screen.getByRole("button", { name: "Test" }))

    await waitFor(() => {
      expect(screen.getByText("1 provider visible")).toBeInTheDocument()
    })
    expect(fetch).toHaveBeenCalledWith(
      "http://remote-machine:6737/v1/usage",
      expect.objectContaining({ method: "GET" })
    )
  })

  it("labels mixed providers as local or remote", () => {
    renderSection({
      ...baseSettings,
      mode: "mixed",
      remoteBaseUrl: "http://remote-machine:6737",
      remotePluginIds: ["codex"],
      setupComplete: true,
    })

    expect(screen.getByRole("button", { name: "Claude: Local" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Codex: Remote" })).toBeInTheDocument()
  })
})
