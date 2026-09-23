import { describe, expect, it } from "vitest"
import { rankModels, type ModelCandidate } from "./model-recommendation"

const candidates: ModelCandidate[] = [
  {
    providerId: "copilot", model: "fast", plan: "Pro", tier: "basic",
    monthlyCostUsd: 10, includedUnits: 1000, remainingFraction: 0.9,
    taskSuccessRate: 0.88, averageUnitsPerTask: 10,
    costPerAcceptedTaskUsd: 0.04,
  },
  {
    providerId: "claude", model: "sonnet", plan: "Pro", tier: "standard",
    monthlyCostUsd: 20, includedUnits: 400, remainingFraction: 0.3,
    taskSuccessRate: 0.96, averageUnitsPerTask: 40,
    costPerAcceptedTaskUsd: 0.12,
  },
]

describe("rankModels", () => {
  it("prefers a capable, high-headroom model for complex work", () => {
    const result = rankModels(candidates, "complex", 25)
    expect(result.map((candidate) => candidate.model)).toEqual(["sonnet"])
    expect(result[0].reason).toContain("96% observed success")
    expect(result[0].reason).toContain("$0.12 per accepted task")
  })

  it("keeps routine work on the cheaper model when it has more capacity", () => {
    const result = rankModels(candidates, "routine", 15)
    expect(result[0].model).toBe("fast")
  })

  it("returns no unsafe recommendation when the budget cannot meet the task tier", () => {
    expect(rankModels(candidates, "critical", 25)).toEqual([])
  })

  it("excludes candidates whose evidence is too weak to protect credits", () => {
    const result = rankModels([
      { ...candidates[0], measurementConfidence: 0.4 },
      { ...candidates[1], measurementConfidence: 0.9 },
    ], "routine", 25)
    expect(result.map((candidate) => candidate.model)).toEqual(["sonnet"])
  })

  it("protects a quota reserve for recovery and verification", () => {
    const result = rankModels([
      { ...candidates[0], remainingFraction: 0.05 },
      { ...candidates[1], remainingFraction: 0.2 },
    ], "routine", 25)
    expect(result.map((candidate) => candidate.model)).toEqual(["sonnet"])
  })
})
