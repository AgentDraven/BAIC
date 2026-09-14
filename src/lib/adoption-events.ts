export type AdoptionEventName = "active" | "returning" | "benchmark_completed" | "recommendation"
export type AdoptionTaskClass = "routine" | "complex" | "critical"
export type AdoptionBudgetBand = "0-15" | "15-30" | "30+"
export type AdoptionPlatform = "windows" | "macos" | "linux"

export type AdoptionEvent = {
  schemaVersion: "v01"
  event: AdoptionEventName
  installationId: string
  release: string
  platform: AdoptionPlatform
  providerIds: string[]
  taskClass?: AdoptionTaskClass
  budgetBand?: AdoptionBudgetBand
  accepted?: boolean
}

type AdoptionEventInput = Omit<AdoptionEvent, "schemaVersion"> & {
  optIn: boolean
}

const providerIdPattern = /^[a-z0-9][a-z0-9-]{0,63}$/

/**
 * Build the only event shape permitted by the v01 adoption specification.
 * This is deliberately local and side-effect free; transport and retention
 * remain opt-in application concerns.
 */
export function buildAdoptionEvent(input: AdoptionEventInput): AdoptionEvent | null {
  if (!input.optIn) return null
  if (!input.installationId.trim() || !input.release.trim()) return null
  if (!input.providerIds.every((providerId) => providerIdPattern.test(providerId))) return null
  if (input.event === "benchmark_completed" && !input.taskClass) return null
  if (input.event === "recommendation" && (!input.taskClass || !input.budgetBand)) return null

  return {
    schemaVersion: "v01",
    event: input.event,
    installationId: input.installationId,
    release: input.release,
    platform: input.platform,
    providerIds: [...new Set(input.providerIds)],
    ...(input.taskClass ? { taskClass: input.taskClass } : {}),
    ...(input.budgetBand ? { budgetBand: input.budgetBand } : {}),
    ...(input.accepted === undefined ? {} : { accepted: input.accepted }),
  }
}

export function isAdoptionEvent(value: unknown): value is AdoptionEvent {
  if (!value || typeof value !== "object") return false
  const event = value as Partial<AdoptionEvent>
  return event.schemaVersion === "v01" &&
    typeof event.event === "string" &&
    typeof event.installationId === "string" &&
    typeof event.release === "string" &&
    typeof event.platform === "string" &&
    Array.isArray(event.providerIds) &&
    event.providerIds.every((providerId) => typeof providerId === "string" && providerIdPattern.test(providerId))
}
