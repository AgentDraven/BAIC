import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { invoke } from "@tauri-apps/api/core"

import { PanelPinControl } from "@/components/panel-pin-control"

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(() => Promise.resolve()),
}))

vi.mock("@tauri-apps/plugin-store", () => ({
  LazyStore: class {
    async get() {
      return null
    }
    async set() {}
    async save() {}
  },
}))

const originalUserAgent = navigator.userAgent

function setUserAgent(value: string) {
  Object.defineProperty(navigator, "userAgent", {
    value,
    configurable: true,
  })
}

describe("PanelPinControl", () => {
  beforeEach(() => {
    vi.mocked(invoke).mockClear()
  })

  afterEach(() => {
    setUserAgent(originalUserAgent)
  })

  it("renders nothing on macOS", () => {
    setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
    )
    const { container } = render(<PanelPinControl />)
    expect(container.firstChild).toBeNull()
  })

  it("renders pin button on non-macOS and toggles pinned state", async () => {
    setUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0"
    )
    render(<PanelPinControl />)

    const button = screen.getByRole("button", { name: "Pin panel" })
    expect(button).toBeInTheDocument()

    await userEvent.click(button)
    expect(invoke).toHaveBeenCalledWith("set_panel_pinned", { pinned: true })
    expect(screen.getByRole("button", { name: "Unpin panel" })).toBeInTheDocument()
  })
})