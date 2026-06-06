import { useCallback, useEffect, useState } from "react";
import { fetchXRayRuntime, postXRayEvent, type XRayRuntime } from "../api";

const FILTERS = ["INFO", "ALL", "HTTP", "DEBUG", "ERROR"] as const;
export type XRayFilter = (typeof FILTERS)[number];

export function useXRayRuntime(enabled: boolean, pollMs = 3000) {
  const [runtime, setRuntime] = useState<XRayRuntime | null>(null);
  const [filters, setFilters] = useState<Set<XRayFilter>>(new Set(["INFO"]));
  const [search, setSearch] = useState("");

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      setRuntime(await fetchXRayRuntime());
    } catch {
      /* ignore poll errors */
    }
  }, [enabled]);

  useEffect(() => {
    refresh();
    if (!enabled) return;
    const t = setInterval(refresh, pollMs);
    return () => clearInterval(t);
  }, [enabled, pollMs, refresh]);

  const toggleFilter = (f: XRayFilter) => {
    setFilters((prev) => {
      const next = new Set(prev);
      if (f === "ALL") return new Set(["ALL"]);
      next.delete("ALL");
      if (next.has(f)) next.delete(f);
      else next.add(f);
      if (next.size === 0) next.add("INFO");
      return next;
    });
  };

  const logEvent = (message: string, level = "DEBUG") => {
    postXRayEvent(level, message).then(refresh);
  };

  const lines = (runtime?.dashboard_events ?? [])
    .concat(
      (runtime?.request_events ?? []).map((e) => ({
        level: e.level ?? "HTTP",
        message: e.message,
        source: "http",
      }))
    )
    .concat(
      (runtime?.logs ?? []).map((e) => ({
        level: e.level,
        message: e.message,
        source: "db",
      }))
    )
    .filter((e) => {
      if (filters.has("ALL")) return true;
      const lvl = (e.level ?? "INFO").toUpperCase();
      if (filters.has("HTTP") && lvl === "HTTP") return true;
      if (filters.has("ERROR") && (lvl === "ERROR" || lvl.includes("FAIL"))) return true;
      if (filters.has("DEBUG") && lvl === "DEBUG") return true;
      if (filters.has("INFO") && (lvl === "INFO" || lvl === "SYSTEM")) return true;
      return false;
    })
    .filter((e) => !search || e.message.toLowerCase().includes(search.toLowerCase()));

  return { runtime, filters, toggleFilter, search, setSearch, lines, logEvent, refresh };
}
