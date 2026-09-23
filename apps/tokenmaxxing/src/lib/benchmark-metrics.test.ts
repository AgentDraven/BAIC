import { describe, expect, it } from "vitest"
import { summarizeBenchmark, summarizeBenchmarkByCandidate } from "./benchmark-metrics"

describe("summarizeBenchmark", () => {
  it("reports outcome, tail, rework, and accepted-task efficiency", () => {
    const summary = summarizeBenchmark([
      { providerId: "a", model: "small", plan: "basic", taskClass: "routine", totalTokens: 100, wallTimeMs: 1000, testsPassed: true, accepted: true, costUsd: 1 },
      { providerId: "a", model: "small", plan: "basic", taskClass: "routine", totalTokens: 300, wallTimeMs: 3000, testsPassed: false, accepted: false, reworkTokens: 50, costUsd: 2 },
      { providerId: "a", model: "small", plan: "basic", taskClass: "routine", totalTokens: 500, wallTimeMs: 5000, testsPassed: true, accepted: true, costUsd: 3 },
    ])

    expect(summary.acceptanceRate).toBeCloseTo(2 / 3)
    expect(summary.testPassRate).toBeCloseTo(2 / 3)
    expect(summary.medianTokens).toBe(300)
    expect(summary.p90Tokens).toBe(460)
    expect(summary.medianReworkTokens).toBe(0)
    expect(summary.tokensPerAcceptedRun).toBe(300)
    expect(summary.costPerAcceptedRunUsd).toBe(2)
  })

  it("drops malformed measurements instead of manufacturing a score", () => {
    const summary = summarizeBenchmark([
      { providerId: "a", model: "small", plan: "basic", taskClass: "routine", totalTokens: -1, wallTimeMs: 1, testsPassed: true, accepted: true },
      { providerId: "a", model: "small", plan: "basic", taskClass: "routine", totalTokens: 100, wallTimeMs: 1, testsPassed: true, accepted: false },
    ])

    expect(summary.runs).toBe(1)
    expect(summary.acceptedRuns).toBe(0)
    expect(summary.tokensPerAcceptedRun).toBeNull()
  })

  it("groups runs by provider, model, plan, and task class", () => {
    const result = summarizeBenchmarkByCandidate([
      { providerId: "a", model: "small", plan: "basic", taskClass: "routine", totalTokens: 100, wallTimeMs: 1, testsPassed: true, accepted: true },
      { providerId: "a", model: "small", plan: "basic", taskClass: "routine", totalTokens: 200, wallTimeMs: 2, testsPassed: true, accepted: false },
      { providerId: "b", model: "standard", plan: "pro", taskClass: "complex", totalTokens: 300, wallTimeMs: 3, testsPassed: true, accepted: true },
    ])
    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({ providerId: "a", model: "small", plan: "basic", taskClass: "routine" })
    expect(result[0].summary.runs).toBe(2)
  })
})
