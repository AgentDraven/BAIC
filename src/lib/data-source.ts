import { isTauri } from "@tauri-apps/api/core"

export type DataSourceMode = "local" | "remote"

/** Desktop app probes providers on this machine; browser views read cached API data. */
export function getDataSourceMode(): DataSourceMode {
  return isTauri() ? "local" : "remote"
}

export function getDataSourceLabel(mode: DataSourceMode = getDataSourceMode()): string {
  return mode === "local" ? "Local" : "Remote"
}
