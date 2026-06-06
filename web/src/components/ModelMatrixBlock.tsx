import { useEffect, useState } from "react";
import { fetchPlatformModels, type PlatformModels } from "../api";

type Props = { providerId: string };

export function ModelMatrixBlock({ providerId }: Props) {
  const [data, setData] = useState<PlatformModels | null>(null);

  useEffect(() => {
    fetchPlatformModels(providerId).then(setData).catch(() => setData(null));
  }, [providerId]);

  if (!data) return <div className="text-xs text-gray-500">Loading P×M matrix…</div>;

  const models = data.models ?? {};
  return (
    <section className="panel space-y-2">
      <h2 className="text-sm font-semibold text-gray-300">BLOCK C: PLATFORM × MODEL MATRIX</h2>
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="text-gray-500">
            <th className="py-1">Model</th>
            <th>Available</th>
            <th>Endpoint</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(models).map(([mid, cell]) => (
            <tr key={mid} className="border-t border-baic-border/50 text-gray-300">
              <td className="py-1 text-cyan-200">{mid}</td>
              <td>{cell.available ? "yes" : "no"}</td>
              <td className="text-gray-500">{cell.endpoint_key ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
