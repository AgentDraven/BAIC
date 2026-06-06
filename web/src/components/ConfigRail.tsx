import { useEffect, useState } from "react";
import { fetchScaffoldStatus, fetchCapabilityMatrix, type CapabilityMatrix } from "../api";

export function ConfigRail() {
  const [matrix, setMatrix] = useState<CapabilityMatrix | null>(null);
  const [scaffold, setScaffold] = useState<{ ok: boolean; errors: string[] } | null>(null);

  useEffect(() => {
    fetchCapabilityMatrix().then(setMatrix).catch(() => setMatrix(null));
    fetchScaffoldStatus().then(setScaffold).catch(() => setScaffold(null));
  }, []);

  return (
    <div className="space-y-4 text-xs">
      <section>
        <h3 className="mb-2 font-semibold text-gray-400">ACTIVE CONFIG</h3>
        <div className="space-y-1 text-gray-300">
          <div>cfg/provider_registry.json</div>
          <div>cfg/model_capability_matrix.json</div>
          <div>cfg/config.json</div>
        </div>
      </section>

      <section>
        <h3 className="mb-2 font-semibold text-gray-400">SCaffold STATUS</h3>
        {scaffold ? (
          <div className={scaffold.ok ? "text-green-400" : "text-red-400"}>
            {scaffold.ok ? "Examples valid" : scaffold.errors.join("; ")}
          </div>
        ) : (
          <div className="text-gray-500">Loading…</div>
        )}
      </section>

      <section>
        <h3 className="mb-2 font-semibold text-gray-400">P×M PLATFORMS</h3>
        <ul className="space-y-1">
          {matrix &&
            Object.entries(matrix.platforms).map(([id, p]) => (
              <li key={id} className="text-cyan-200">
                {id} — {Object.keys(p.models ?? {}).length} models
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}
