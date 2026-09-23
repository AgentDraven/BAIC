import { readFile } from "node:fs/promises"
import { rankModels } from "../src/lib/model-recommendation.ts"

const inputPath = process.argv[2]
const task = process.argv[3] ?? "routine"
const budgetArg = process.argv[4]
const monthlyBudgetUsd = budgetArg === undefined ? undefined : Number(budgetArg)

if (!inputPath) {
  console.error("Usage: node --experimental-strip-types scripts/recommend-model.mjs <candidates.json> [routine|complex|critical] [monthlyBudgetUsd]")
  process.exit(2)
}
if (!["routine", "complex", "critical"].includes(task)) throw new Error("task must be routine, complex, or critical")
if (budgetArg !== undefined && (!Number.isFinite(monthlyBudgetUsd) || monthlyBudgetUsd < 0)) {
  throw new Error("monthlyBudgetUsd must be a non-negative number")
}

const parsed = JSON.parse(await readFile(inputPath, "utf8"))
const candidates = Array.isArray(parsed) ? parsed : parsed.candidates
if (!Array.isArray(candidates)) throw new Error("candidate input must be an array or an object with a candidates array")

const recommendations = rankModels(candidates, task, monthlyBudgetUsd).slice(0, 5)
console.log(JSON.stringify({ schemaVersion: "v01", task, monthlyBudgetUsd: monthlyBudgetUsd ?? null, recommendationCount: recommendations.length, recommendations }, null, 2))
