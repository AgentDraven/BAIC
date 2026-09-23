import { execFileSync } from "node:child_process"
import { describe, expect, it } from "vitest"

describe("v01 coverage report", () => {
  it("reports provider coverage and all required measurement dimensions", () => {
    const output = execFileSync(process.execPath, ["scripts/report-v01-coverage.mjs"], {
      cwd: process.cwd(),
      encoding: "utf8",
    })
    const report = JSON.parse(output)

    expect(report.schemaVersion).toBe("v01")
    expect(report.providerCount).toBeGreaterThan(0)
    expect(report.counts.explicit).toBeGreaterThan(0)
    expect(report.dimensionCounts).toEqual(expect.objectContaining({
      capacity: expect.any(Number),
      model: expect.any(Number),
      cost: expect.any(Number),
      reset: expect.any(Number),
      provenance: expect.any(Number),
    }))
    expect(report.providers).toHaveLength(report.providerCount)
  })
})
