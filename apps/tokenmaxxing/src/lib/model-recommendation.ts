export type ModelTier = "basic" | "standard" | "frontier"
export type TaskClass = "routine" | "complex" | "critical"

export type ModelCandidate = {
  providerId: string
  model: string
  plan: string
  tier: ModelTier
  monthlyCostUsd: number
  includedUnits: number
  remainingFraction: number
  taskSuccessRate: number
  averageUnitsPerTask: number
  averageLatencyMs?: number
  costPerAcceptedTaskUsd?: number
  measurementConfidence?: number
}

export type ModelSelection = ModelCandidate & {
  score: number
  reason: string
}

const requiredTier: Record<TaskClass, ModelTier> = {
  routine: "basic",
  complex: "standard",
  critical: "frontier",
}

const tierRank: Record<ModelTier, number> = { basic: 1, standard: 2, frontier: 3 }

function clamp(value: number) {
  return Math.max(0, Math.min(1, value))
}

/**
 * Rank models using observed outcomes, quota headroom, and accepted-task cost.
 * Candidates below the task's minimum tier or above the monthly budget are excluded.
 * Low-confidence measurements and candidates below the protected quota reserve
 * are excluded rather than converted into guesses.
 */
export function rankModels(
  candidates: ModelCandidate[],
  task: TaskClass,
  monthlyBudgetUsd?: number,
  minimumHeadroomFraction = 0.1,
): ModelSelection[] {
  const minimumTier = tierRank[requiredTier[task]]
  const reserve = clamp(minimumHeadroomFraction)
  const eligible = candidates.filter((candidate) => (
      tierRank[candidate.tier] >= minimumTier &&
      candidate.monthlyCostUsd >= 0 &&
      (monthlyBudgetUsd === undefined || candidate.monthlyCostUsd <= monthlyBudgetUsd) &&
      candidate.includedUnits > 0 &&
      candidate.averageUnitsPerTask > 0 &&
      clamp(candidate.remainingFraction) >= reserve &&
      (candidate.costPerAcceptedTaskUsd === undefined ||
        (Number.isFinite(candidate.costPerAcceptedTaskUsd) && candidate.costPerAcceptedTaskUsd >= 0)) &&
      (candidate.measurementConfidence === undefined ||
        (Number.isFinite(candidate.measurementConfidence) && candidate.measurementConfidence >= 0.6))
    ))
  const observedCosts = eligible.flatMap((candidate) => candidate.costPerAcceptedTaskUsd === undefined
    ? []
    : [candidate.costPerAcceptedTaskUsd])
  const maxObservedCost = Math.max(...observedCosts, 0)

  return eligible
    .map((candidate) => {
      const success = clamp(candidate.taskSuccessRate)
      const headroom = clamp(candidate.remainingFraction)
      const tasksRemaining = candidate.includedUnits * headroom / candidate.averageUnitsPerTask
      const efficiency = clamp(tasksRemaining / 100)
      const latency = candidate.averageLatencyMs === undefined
        ? 0.5
        : 1 - clamp(candidate.averageLatencyMs / 30_000)
      const cost = candidate.costPerAcceptedTaskUsd === undefined || maxObservedCost === 0
        ? 0.5
        : 1 - clamp(candidate.costPerAcceptedTaskUsd / maxObservedCost)
      const confidence = candidate.measurementConfidence === undefined
        ? 0.5
        : clamp(candidate.measurementConfidence)
      const score = success * 0.40 + headroom * 0.25 + efficiency * 0.20 + cost * 0.10 + latency * 0.03 + confidence * 0.02
      const costReason = candidate.costPerAcceptedTaskUsd === undefined
        ? "accepted-task cost not measured"
        : `$${candidate.costPerAcceptedTaskUsd.toFixed(2)} per accepted task`
      return {
        ...candidate,
        score,
        reason: `${Math.floor(tasksRemaining)} estimated tasks remaining; ` +
          `${Math.round(success * 100)}% observed success; ` +
          `${Math.round(headroom * 100)}% quota headroom; ${costReason}`,
      }
    })
    .sort((a, b) => b.score - a.score || a.monthlyCostUsd - b.monthlyCostUsd)
}
