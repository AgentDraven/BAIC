import { CostGauge } from "./CostGauge";
import type { ProviderConsole } from "../api";

type Props = {
  data: ProviderConsole;
  onBack: () => void;
  onAction: (op: string) => void;
};

export function ProviderConsoleView({ data, onBack, onAction }: Props) {
  const vertex = data.blocks.find((b) => b.id === "vertex_ai");
  const studio = data.blocks.find((b) => b.id === "ai_studio");
  const guard = vertex?.guardrails;

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-baic-border pb-4">
        <div>
          <button type="button" className="text-xs text-cyan-400 hover:underline" onClick={onBack}>
            ← BACK TO HUB
          </button>
          <h1 className="mt-1 text-lg font-bold text-cyan-200">{data.display_name}</h1>
        </div>
        <div className="text-right text-xs text-gray-500">
          <div>ACTIVE ROUTE: M4O-Venture (VERTEX)</div>
          <div>INTERCEPTION: INLINE MIDDLEWARE LOCAL PIPELINE</div>
        </div>
      </header>

      {studio && (
        <section className="panel space-y-3">
          <h2 className="text-sm font-semibold text-gray-300">{studio.title}</h2>
          <div className="grid gap-4 md:grid-cols-3 text-xs">
            <div>
              <div className="mb-1 text-gray-500">PROJECTS</div>
              {(studio.projects ?? []).map((p) => (
                <div key={p} className="text-cyan-200">
                  [•] {p}
                </div>
              ))}
            </div>
            <div>
              <div className="mb-1 text-gray-500">QUOTA CEILING</div>
              <div>{(studio.tpm_ceiling ?? 0).toLocaleString()} TPM</div>
            </div>
            <div>
              <div className="mb-1 text-gray-500">2026 COMMERCIAL MATRIX</div>
              {studio.pricing_matrix &&
                Object.entries(studio.pricing_matrix).map(([k, v]) => (
                  <div key={k} className="text-gray-400">
                    {k.replace(/_/g, " ")}: ${v}/1M
                  </div>
                ))}
            </div>
          </div>
        </section>
      )}

      {vertex && (
        <section className="panel space-y-3">
          <h2 className="text-sm font-semibold text-gray-300">{vertex.title}</h2>
          <div className="grid gap-4 md:grid-cols-3 text-xs">
            <div>
              <div className="mb-1 text-gray-500">PROMO POOLS</div>
              {(vertex.promo_pools ?? []).map((p) => (
                <div key={p.name} className="text-green-400">
                  [•] {p.name}: ${p.balance} — exp {p.expires ?? "N/A"}
                </div>
              ))}
            </div>
            <div>
              <div className="mb-1 text-gray-500">GUARDRAILS</div>
              {guard && (
                <>
                  <div>Run: ${guard.current_cost.toFixed(2)}</div>
                  <div>Cap: ${guard.spend_cap.toFixed(2)}</div>
                  <div>Auto-swap @ {guard.auto_swap_at_tpm_pct}% TPM</div>
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-2 content-start">
              {data.operations.map((op) => (
                <button key={op} type="button" className="btn-primary" onClick={() => onAction(op)}>
                  {op.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {guard && <CostGauge currentCost={guard.current_cost} spendCap={guard.spend_cap} />}

      {!studio && data.blocks[0] && (
        <section className="panel">
          <h2 className="text-sm font-semibold">{data.blocks[0].title}</h2>
          <pre className="mt-2 overflow-auto text-xs text-gray-400">
            {JSON.stringify(data.blocks[0].metrics ?? data.metrics, null, 2)}
          </pre>
        </section>
      )}
    </div>
  );
}
