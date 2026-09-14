export type ActionTransport = "api" | "local" | "none"
export type ActionOutcome = "committed" | "failed" | "rejected"

export type UserActionEvent = {
  schema: "merit.telemetry.action.v1"
  eventType: string
  eventId: string
  requestId: string
  occurredAt: string
  utilityId: string
  quantity: number
  transport: ActionTransport
  apiCallMade: boolean
  outcome: ActionOutcome
  providerId?: string
  model?: string
  costUsd?: number
  costSource?: "provider" | "estimated" | "local" | "none"
  metricKeys?: string[]
}

export type UserActionInput = Omit<UserActionEvent, "schema" | "eventId" | "requestId" | "occurredAt"> & {
  requestId?: string
  occurredAt?: string
}

const SAFE_VALUE = /^[a-z0-9][a-z0-9._:-]{1,120}$/i

export function buildUserActionEvent(input: UserActionInput): UserActionEvent | null {
  if (!SAFE_VALUE.test(input.eventType) || !SAFE_VALUE.test(input.utilityId)) return null
  if (!Number.isFinite(input.quantity) || input.quantity < 0) return null
  if (input.apiCallMade !== (input.transport === "api")) return null
  if (input.costUsd !== undefined && (!Number.isFinite(input.costUsd) || input.costUsd < 0)) return null

  const occurredAt = input.occurredAt ?? new Date().toISOString()
  const requestId = input.requestId ?? `${input.eventType}:${occurredAt}`
  if (!SAFE_VALUE.test(requestId)) return null

  return {
    schema: "merit.telemetry.action.v1",
    eventType: input.eventType,
    eventId: requestId,
    requestId,
    occurredAt,
    utilityId: input.utilityId,
    quantity: input.quantity,
    transport: input.transport,
    apiCallMade: input.apiCallMade,
    outcome: input.outcome,
    ...(input.providerId && SAFE_VALUE.test(input.providerId) ? { providerId: input.providerId } : {}),
    ...(input.model && SAFE_VALUE.test(input.model) ? { model: input.model } : {}),
    ...(input.costUsd !== undefined ? { costUsd: input.costUsd } : {}),
    ...(input.costSource ? { costSource: input.costSource } : {}),
    ...(input.metricKeys ? { metricKeys: input.metricKeys.filter((key) => SAFE_VALUE.test(key)).slice(0, 32) } : {}),
  }
}

export function isUserActionEvent(value: unknown): value is UserActionEvent {
  if (!value || typeof value !== "object") return false
  const event = value as Partial<UserActionEvent>
  return event.schema === "merit.telemetry.action.v1" &&
    typeof event.eventType === "string" &&
    typeof event.eventId === "string" &&
    typeof event.requestId === "string" &&
    typeof event.occurredAt === "string" &&
    typeof event.utilityId === "string" &&
    typeof event.quantity === "number" &&
    typeof event.apiCallMade === "boolean" &&
    (event.transport === "api" || event.transport === "local" || event.transport === "none") &&
    (event.outcome === "committed" || event.outcome === "failed" || event.outcome === "rejected")
}

const ACTION_HISTORY_KEY = "baic.merit.action-history.v1"
const MAX_ACTION_EVENTS = 1000

export function recordUserAction(event: UserActionEvent, storage: Storage | undefined = globalThis.localStorage): void {
  if (!storage) return
  let existing: UserActionEvent[] = []
  try {
    const parsed: unknown = JSON.parse(storage.getItem(ACTION_HISTORY_KEY) ?? "[]")
    if (Array.isArray(parsed)) existing = parsed.filter(isUserActionEvent)
    storage.setItem(ACTION_HISTORY_KEY, JSON.stringify([...existing, event].slice(-MAX_ACTION_EVENTS)))
  } catch {
    // Measurement must never interrupt the user action being measured.
  }
}

export function listUserActions(storage: Storage | undefined = globalThis.localStorage): UserActionEvent[] {
  if (!storage) return []
  try {
    const parsed: unknown = JSON.parse(storage.getItem(ACTION_HISTORY_KEY) ?? "[]")
    return Array.isArray(parsed) ? parsed.filter(isUserActionEvent) : []
  } catch {
    return []
  }
}

export function clearUserActions(storage: Storage | undefined = globalThis.localStorage): void {
  try { storage?.removeItem(ACTION_HISTORY_KEY) } catch { /* best effort */ }
}
