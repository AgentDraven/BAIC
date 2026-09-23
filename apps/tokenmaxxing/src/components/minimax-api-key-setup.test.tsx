import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { MinimaxApiKeySetup } from "@/components/minimax-api-key-setup"

const hasPluginEnvValueMock = vi.fn()
const setPluginEnvValueMock = vi.fn()

vi.mock("@/lib/plugin-env-secrets", () => ({
  hasPluginEnvValue: (...args: unknown[]) => hasPluginEnvValueMock(...args),
  setPluginEnvValue: (...args: unknown[]) => setPluginEnvValueMock(...args),
}))

describe("MinimaxApiKeySetup", () => {
  beforeEach(() => {
    hasPluginEnvValueMock.mockReset()
    setPluginEnvValueMock.mockReset()
  })

  it("shows the API key form when no key is configured", async () => {
    hasPluginEnvValueMock.mockResolvedValue(false)

    render(<MinimaxApiKeySetup onSaved={vi.fn()} />)

    expect(await screen.findByLabelText("MiniMax API key")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument()
  })

  it("stays hidden when a key already exists", async () => {
    hasPluginEnvValueMock.mockResolvedValue(true)

    render(<MinimaxApiKeySetup onSaved={vi.fn()} />)

    await waitFor(() => {
      expect(hasPluginEnvValueMock).toHaveBeenCalledWith("MINIMAX_API_KEY")
    })
    expect(screen.queryByLabelText("MiniMax API key")).not.toBeInTheDocument()
  })

  it("saves the key and calls onSaved", async () => {
    const user = userEvent.setup()
    const onSaved = vi.fn()
    hasPluginEnvValueMock.mockResolvedValue(false)
    setPluginEnvValueMock.mockResolvedValue(undefined)

    render(<MinimaxApiKeySetup onSaved={onSaved} />)

    await user.type(await screen.findByLabelText("MiniMax API key"), "mini-secret")
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => {
      expect(setPluginEnvValueMock).toHaveBeenCalledWith("MINIMAX_API_KEY", "mini-secret")
      expect(onSaved).toHaveBeenCalled()
    })
  })
})