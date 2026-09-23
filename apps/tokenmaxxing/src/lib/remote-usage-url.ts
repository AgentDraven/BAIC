export function cleanRemoteBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, "")
}

export function buildRemoteUsageUrl(value: string): string {
  const normalized = cleanRemoteBaseUrl(value)
  if (!normalized) return ""
  if (normalized.endsWith("/v1/usage")) return normalized
  return `${normalized}/v1/usage`
}
