import { useEffect, useState } from "react";
import { fetchPlatformModels, type PlatformModels, type ProvenanceMeta } from "../api";
import { ProvenanceHotspot } from "./ProvenanceHotspot";

type Props = { providerId: string };

type ModelCell = {
  available?: boolean;
  declared_available?: boolean;
  live_verified?: boolean;
  endpoint_key?: string;
  display_name?: string;
  provenance?: ProvenanceMeta;
};

export function ModelMatrixBlock({ providerId }: Props) {
  const [data, setData] = useState<PlatformModels | null>(null);

  useEffect(() => {
    fetchPlatformModels(providerId).then(setData).catch(() => setData(null));
  }, [providerId]);

  if (!data) return <div className="text-xs text-gray-500">Loading P×M matrix…</div>;

  const models = (data.models ?? {}) as Record<string, ModelCell>;
  const entries = Object.entries(models);

  return (
    <section className="panel space-y-2">
      <h2 className="text-sm font-semibold text-gray-300">BLOCK C: PLATFORM × MODEL MATRIX</h2>
      {data.matrix_provenance && (
        <p className="text-[10px] text-gray-600">
          <ProvenanceHotspot provenance={data.matrix_provenance}>Cfg-declared routing matrix</ProvenanceHotspot>
        </p>
      )}
      {entries.length === 0 && <div className="text-xs text-gray-500">No models declared for this platform in cfg.</div>}
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="text-gray-500">
            <th className="py-1">Model</th>
            <th>Declared</th>
            <th>Live verified</th>
            <th>Endpoint</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([mid, cell]) => (
            <tr key={mid} className="border-t border-baic-border/50 text-gray-300">
              <td className="py-1 text-cyan-200">
                <ProvenanceHotspot provenance={cell.provenance}>{cell.display_name ?? mid}</ProvenanceHotspot>
              </td>
              <td>{cell.declared_available ? "yes" : "no"}</td>
              <td>{cell.live_verified ? "yes" : "no"}</td>
              <td className="text-gray-500">
                <ProvenanceHotspot provenance={cell.provenance}>{cell.endpoint_key ?? "—"}</ProvenanceHotspot>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
