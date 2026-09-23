export type BenchmarkRun = {
  providerId: string
  model: string
  plan: string
  taskClass: "routine" | "complex" | "critical"
  totalTokens: number
  wallTimeMs: number
  testsPassed: boolean
  accepted: boolean
  reworkTokens?: number
  costUsd?: number
}

export type BenchmarkSummary = {
  runs: number
  acceptedRuns: number
  acceptanceRate: number
  testPassRate: number
  medianTokens: number
  p90Tokens: number
  medianWallTimeMs: number
  p90WallTimeMs: number
  medianReworkTokens: number
  tokensPerAcceptedRun: number | null
  costPerAcceptedRunUsd: number | null
}

export type BenchmarkCandidateSummary = {
  providerId: string
  model: string
  plan: string
  taskClass: BenchmarkRun["taskClass"]
  summary: BenchmarkSummary
}

function quantile(values: number[], fraction: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = (sorted.length - 1) * fraction
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  if (lower === upper) return sorted[lower]
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower)
}

function validRuns(runs: BenchmarkRun[]): BenchmarkRun[] {
  return runs.filter((run) => (
    Number.isFinite(run.totalTokens) && run.totalTokens >= 0 &&
    Number.isFinite(run.wallTimeMs) && run.wallTimeMs >= 0 &&
    (run.reworkTokens === undefined || (Number.isFinite(run.reworkTokens) && run.reworkTokens >= 0)) &&
    (run.costUsd === undefined || (Number.isFinite(run.costUsd) && run.costUsd >= 0))
  ))
}

/** Summarize benchmark outcomes without treating raw token volume as quality. */
export function summarizeBenchmark(runs: BenchmarkRun[]): BenchmarkSummary {
  const measured = validRuns(runs)
  const accepted = measured.filter((run) => run.accepted)
  const tokens = measured.map((run) => run.totalTokens)
  const wallTime = measured.map((run) => run.wallTimeMs)
  const rework = measured.map((run) => run.reworkTokens ?? 0)
  const costs = measured.flatMap((run) => run.costUsd === undefined ? [] : [run.costUsd])
  const acceptedCosts = accepted.flatMap((run) => run.costUsd === undefined ? [] : [run.costUsd])
  const acceptedTokenTotal = accepted.reduce((sum, run) => sum + run.totalTokens, 0)

  return {
    runs: measured.length,
    acceptedRuns: accepted.length,
    acceptanceRate: measured.length === 0 ? 0 : accepted.length / measured.length,
    testPassRate: measured.length === 0 ? 0 : measured.filter((run) => run.testsPassed).length / measured.length,
    medianTokens: quantile(tokens, 0.5),
    p90Tokens: quantile(tokens, 0.9),
    medianWallTimeMs: quantile(wallTime, 0.5),
    p90WallTimeMs: quantile(wallTime, 0.9),
    medianReworkTokens: quantile(rework, 0.5),
    tokensPerAcceptedRun: accepted.length === 0 ? null : acceptedTokenTotal / accepted.length,
    costPerAcceptedRunUsd: acceptedCosts.length === 0 || costs.length === 0
      ? null
      : acceptedCosts.reduce((sum, cost) => sum + cost, 0) / acceptedCosts.length,
  }
}

/** Group repeated benchmark runs so plan/model comparisons use identical math. */
export function summarizeBenchmarkByCandidate(runs: BenchmarkRun[]): BenchmarkCandidateSummary[] {
  const groups = new Map<string, BenchmarkRun[]>()
  for (const run of runs) {
    const key = JSON.stringify([run.providerId, run.model, run.plan, run.taskClass])
    const group = groups.get(key) ?? []
    group.push(run)
    groups.set(key, group)
  }
  return [...groups.entries()].map(([key, group]) => {
    const [providerId, model, plan, taskClass] = JSON.parse(key) as [string, string, string, BenchmarkRun["taskClass"]]
    return { providerId, model, plan, taskClass, summary: summarizeBenchmark(group) }
  })
}
