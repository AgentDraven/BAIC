import { describe, expect, it } from "vitest"
import { isMinimaxApiKeyMissingError } from "@/lib/minimax-api-key"

describe("isMinimaxApiKeyMissingError", () => {
  it("matches the MiniMax missing-key probe error", () => {
    expect(
      isMinimaxApiKeyMissingError(
        "MiniMax API key missing. Set MINIMAX_API_KEY or MINIMAX_CN_API_KEY."
      )
    ).toBe(true)
  })

  it("returns false for other errors", () => {
    expect(isMinimaxApiKeyMissingError("Session expired. Check your MiniMax API key.")).toBe(
      false
    )
    expect(isMinimaxApiKeyMissingError(null)).toBe(false)
  })
})