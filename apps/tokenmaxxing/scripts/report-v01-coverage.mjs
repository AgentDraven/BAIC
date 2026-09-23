import { readdir, readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { join } from "node:path"

const pluginsRoot = fileURLToPath(new URL("../plugins/", import.meta.url))
const entries = await readdir(pluginsRoot, { withFileTypes: true })
const providers = []

for (const entry of entries.filter((item) => item.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
  const pluginPath = join(pluginsRoot, entry.name, "plugin.js")
  let source
  try {
    source = await readFile(pluginPath, "utf8")
  } catch {
    continue
  }
  const emitsStructuredMetrics = /\bmetrics\s*[:},]/.test(source)
  const hasProgressLines = /line\.progress|type\s*:\s*["']progress["']/.test(source)
  const metricDimensions = {
    capacity: /tokens?\.|quota\.|requests\.|\b(currentValue|remaining|limit|used)\b/i.test(source),
    model: /\bmodel\s*:/i.test(source) && /metrics\.push|metrics\s*:/i.test(source),
    cost: /cost\.|unit\s*:\s*["']dollars["']/i.test(source),
    reset: /resetsAt|periodDurationMs/i.test(source),
    provenance: /sourceUrl|confidence\s*:|source\s*:\s*["'](?:provider|local-log|estimated)["']/i.test(source),
  }
  providers.push({
    providerId: entry.name,
    explicitStructuredMetrics: emitsStructuredMetrics,
    runtimeDerivedQuotaMetrics: hasProgressLines,
    coverage: emitsStructuredMetrics ? "explicit" : hasProgressLines ? "derived-quota" : "line-only",
    metricDimensions,
  })
}

const counts = providers.reduce((result, provider) => {
  result[provider.coverage] = (result[provider.coverage] ?? 0) + 1
  return result
}, {})

const dimensionCounts = Object.fromEntries(
  Object.keys(providers[0]?.metricDimensions ?? {}).map((dimension) => [
    dimension,
    providers.filter((provider) => provider.metricDimensions[dimension]).length,
  ]),
)

console.log(JSON.stringify({ schemaVersion: "v01", providerCount: providers.length, counts, dimensionCounts, providers }, null, 2))
