import { describe, expect, it } from "vitest"
import { buildRemoteUsageUrl, cleanRemoteBaseUrl } from "@/lib/remote-usage-url"

describe("remote usage url helpers", () => {
  it("normalizes base URLs and builds the usage endpoint", () => {
    expect(cleanRemoteBaseUrl(" http://remote-machine:6737/// ")).toBe("http://remote-machine:6737")
    expect(buildRemoteUsageUrl(" http://remote-machine:6737/// ")).toBe(
      "http://remote-machine:6737/v1/usage"
    )
  })

  it("accepts a pasted /v1/usage endpoint", () => {
    expect(buildRemoteUsageUrl("http://remote-machine:6737/v1/usage")).toBe(
      "http://remote-machine:6737/v1/usage"
    )
  })
})
