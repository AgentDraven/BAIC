import { useXRayRuntime } from "../hooks/useXRayRuntime";

type Props = { enabled?: boolean };

export function XRayTerminal({ enabled = true }: Props) {
  const { filters, toggleFilter, search, setSearch, lines, runtime } = useXRayRuntime(enabled);

  return (
    <div className="flex h-full min-h-[240px] flex-col font-mono text-xs">
      <div className="mb-2 flex flex-wrap gap-1">
        {(["INFO", "ALL", "HTTP", "DEBUG", "ERROR"] as const).map((f) => (
          <button
            key={f}
            type="button"
            className={`rounded px-2 py-0.5 ${filters.has(f) ? "bg-cyan-500/30 text-cyan-200" : "bg-gray-800 text-gray-400"}`}
            onClick={() => toggleFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>
      <input
        className="mb-2 rounded border border-baic-border bg-black/40 px-2 py-1 text-gray-200"
        placeholder="Search X-Ray…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {runtime?.stub_manifest && (
        <pre className="mb-2 max-h-24 overflow-auto rounded bg-amber-900/20 p-2 text-[10px] text-amber-200">
          {JSON.stringify(runtime.stub_manifest, null, 2)}
        </pre>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto rounded border border-baic-border bg-black/60 p-2 text-gray-300">
        {lines.map((e, i) => (
          <div key={i} className="whitespace-pre-wrap break-all">
            [{e.level}] {e.message}
          </div>
        ))}
      </div>
    </div>
  );
}
