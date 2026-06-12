import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { ProviderDetailPage } from "@/pages/provider-detail"

vi.mock("@/components/minimax-api-key-setup", () => ({
  MinimaxApiKeySetup: () => <div data-testid="minimax-api-key-setup" />,
}))

describe("ProviderDetailPage", () => {
  it("shows not found when plugin missing", () => {
    render(<ProviderDetailPage plugin={null} displayMode="used" resetTimerDisplayMode="relative" />)
    expect(screen.getByText("Provider not found")).toBeInTheDocument()
  })

  it("renders ProviderCard with all scope when plugin present", async () => {
    render(
      <ProviderDetailPage
        displayMode="used"
        resetTimerDisplayMode="relative"
        plugin={{
          meta: { id: "a", name: "Alpha", iconUrl: "", lines: [] },
          data: { providerId: "a", displayName: "Alpha", iconUrl: "", lines: [] },
          loading: false,
          error: null,
          lastManualRefreshAt: null,
          lastUpdatedAt: null,
        }}
      />
    )
    expect(screen.getAllByText("Alpha").length).toBeGreaterThan(0)
  })

  it("renders when plugin data is null (still shows provider name)", () => {
    render(
      <ProviderDetailPage
        displayMode="used"
        resetTimerDisplayMode="relative"
        plugin={{
          meta: { id: "a", name: "Alpha", iconUrl: "", lines: [] },
          data: null,
          loading: false,
          error: null,
          lastManualRefreshAt: null,
          lastUpdatedAt: null,
        }}
      />
    )
    expect(screen.getAllByText("Alpha").length).toBeGreaterThan(0)
  })

  it("shows MiniMax API key setup on the MiniMax detail page", () => {
    render(
      <ProviderDetailPage
        displayMode="used"
        resetTimerDisplayMode="relative"
        plugin={{
          meta: { id: "minimax", name: "MiniMax", iconUrl: "", lines: [] },
          data: null,
          loading: false,
          error: "MiniMax API key missing. Set MINIMAX_API_KEY or MINIMAX_CN_API_KEY.",
          lastManualRefreshAt: null,
          lastUpdatedAt: null,
        }}
      />
    )
    expect(screen.getByTestId("minimax-api-key-setup")).toBeInTheDocument()
  })

  it("renders quick links when provided by plugin meta", () => {
    render(
      <ProviderDetailPage
        displayMode="used"
        resetTimerDisplayMode="relative"
        plugin={{
          meta: {
            id: "a",
            name: "Alpha",
            iconUrl: "",
            lines: [],
            links: [{ label: "Status", url: "https://status.example.com" }],
          },
          data: null,
          loading: false,
          error: null,
          lastManualRefreshAt: null,
          lastUpdatedAt: null,
        }}
      />
    )
    expect(screen.getByRole("button", { name: /status/i })).toBeInTheDocument()
  })
})
