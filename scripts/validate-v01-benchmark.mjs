import { readFile } from "node:fs/promises"

const inputPath = process.argv[2]
if (!inputPath) {
  console.error("Usage: node scripts/validate-v01-benchmark.mjs <results.json|results.jsonl>")
  process.exit(2)
}

const raw = await readFile(inputPath, "utf8")
let runs
try {
  const parsed = JSON.parse(raw)
  runs = Array.isArray(parsed) ? parsed : parsed.runs
} catch {
  runs = raw.split(/\r?\n/).filter(Boolean).map((line, index) => {
    try {
      return JSON.parse(line)
    } catch {
      throw new Error(`line ${index + 1} is not valid JSON`)
    }
  })
}

if (!Array.isArray(runs)) throw new Error("benchmark results must be an array or an object with a runs array")

const requiredStrings = ["providerId", "model", "plan", "taskClass"]
const requiredNumbers = ["totalTokens", "wallTimeMs"]
const allowedTaskClasses = new Set(["routine", "complex", "critical"])
const errors = []
const groups = new Map()

for (const [index, run] of runs.entries()) {
  const label = `run ${index + 1}`
  if (!run || typeof run !== "object" || Array.isArray(run)) {
    errors.push(`${label}: must be an object`)
    continue
  }
  for (const key of requiredStrings) {
    if (typeof run[key] !== "string" || !run[key].trim()) errors.push(`${label}: ${key} is required`)
  }
  if (!allowedTaskClasses.has(run.taskClass)) errors.push(`${label}: taskClass must be routine, complex, or critical`)
  for (const key of requiredNumbers) {
    if (typeof run[key] !== "number" || !Number.isFinite(run[key]) || run[key] < 0) {
      errors.push(`${label}: ${key} must be a finite non-negative number`)
    }
  }
  for (const key of ["testsPassed", "accepted"]) {
    if (typeof run[key] !== "boolean") errors.push(`${label}: ${key} must be boolean`)
  }
  for (const key of ["reworkTokens", "costUsd"]) {
    if (run[key] !== undefined && (typeof run[key] !== "number" || !Number.isFinite(run[key]) || run[key] < 0)) {
      errors.push(`${label}: ${key} must be finite and non-negative when present`)
    }
  }
  const key = JSON.stringify([run.providerId, run.model, run.plan, run.taskClass])
  groups.set(key, (groups.get(key) ?? 0) + 1)
}

const underSampled = [...groups.entries()]
  .filter(([, count]) => count < 3)
  .map(([key, count]) => ({ candidate: JSON.parse(key), runs: count, requiredRuns: 3 }))

const result = {
  schemaVersion: "v01",
  runCount: runs.length,
  candidateCount: groups.size,
  valid: errors.length === 0 && underSampled.length === 0,
  errors,
  underSampled,
}
console.log(JSON.stringify(result, null, 2))
if (!result.valid) process.exit(1)
