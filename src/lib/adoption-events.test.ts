import { describe, expect, it } from "vitest"
import { buildAdoptionEvent, isAdoptionEvent } from "./adoption-events"

describe("adoption events", () => {
  it("emits only the v01 aggregate fields when opted in", () => {
    const event = buildAdoptionEvent({
      optIn: true,
      event: "recommendation",
      installationId: "rotated-id",
      release: "0.7.14",
      platform: "windows",
      providerIds: ["claude", "claude"],
      taskClass: "routine",
      budgetBand: "0-15",
      accepted: true,
    })

    expect(event).toEqual({
      schemaVersion: "v01",
      event: "recommendation",
      installationId: "rotated-id",
      release: "0.7.14",
      platform: "windows",
      providerIds: ["claude"],
      taskClass: "routine",
      budgetBand: "0-15",
      accepted: true,
    })
    expect(isAdoptionEvent(event)).toBe(true)
  })

  it("does not create events without opt-in or required aggregate context", () => {
    expect(buildAdoptionEvent({
      optIn: false,
      event: "active",
      installationId: "id",
      release: "0.7.14",
      platform: "windows",
      providerIds: [],
    })).toBeNull()
    expect(buildAdoptionEvent({
      optIn: true,
      event: "recommendation",
      installationId: "id",
      release: "0.7.14",
      platform: "windows",
      providerIds: ["not valid"],
    })).toBeNull()
  })
})
