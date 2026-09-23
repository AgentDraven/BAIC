import { describe, expect, it } from "vitest"
import { buildUserActionEvent, clearUserActions, listUserActions, recordUserAction } from "./action-events"

function storage(): Storage {
  const values = new Map<string, string>()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
    key: () => null,
    length: 0,
  }
}

describe("MERIT user action measurement", () => {
  it("records a committed local action even when no API call occurred", () => {
    const event = buildUserActionEvent({
      eventType: "usage.refresh",
      utilityId: "baic",
      quantity: 3,
      transport: "local",
      apiCallMade: false,
      outcome: "committed",
      requestId: "usage.refresh:local-1",
      occurredAt: "2026-09-13T00:00:00.000Z",
      costUsd: 0,
      costSource: "local",
    })
    expect(event).not.toBeNull()
    const store = storage()
    recordUserAction(event!, store)
    expect(listUserActions(store)).toEqual([event])
  })

  it("rejects inconsistent transport and API-call claims", () => {
    expect(buildUserActionEvent({
      eventType: "usage.refresh",
      utilityId: "baic",
      quantity: 1,
      transport: "none",
      apiCallMade: true,
      outcome: "committed",
    })).toBeNull()
  })

  it("clears local action history", () => {
    const store = storage()
    const event = buildUserActionEvent({ eventType: "metrics.export", utilityId: "baic", quantity: 1, transport: "none", apiCallMade: false, outcome: "committed" })
    recordUserAction(event!, store)
    clearUserActions(store)
    expect(listUserActions(store)).toEqual([])
  })
})
