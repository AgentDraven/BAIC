import { useCallback, useEffect, useState } from "react";
import {
  fetchConsole,
  fetchHub,
  runOp,
  type HubSummary,
  type ProviderConsole,
} from "./api";
import { ProviderCardView } from "./components/ProviderCardView";
import { ProviderConsoleView } from "./components/ProviderConsoleView";

export default function App() {
  const [hub, setHub] = useState<HubSummary | null>(null);
  const [console, setConsole] = useState<ProviderConsole | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadHub = useCallback(async () => {
    try {
      setHub(await fetchHub());
      setError(null);
    } catch (e) {
      setError(String(e));
    }
  }, []);

  useEffect(() => {
    loadHub();
    const t = setInterval(loadHub, 30000);
    return () => clearInterval(t);
  }, [loadHub]);

  const openProvider = async (id: string) => {
    try {
      setConsole(await fetchConsole(id));
    } catch (e) {
      setError(String(e));
    }
  };

  const handleAction = async (providerId: string, op: string) => {
    const res = await runOp(providerId, op);
    setToast(res.message ?? (res.ok ? "Done" : "Failed"));
    setTimeout(() => setToast(null), 4000);
    loadHub();
  };

  if (console) {
    return (
      <>
        {toast && <Toast message={toast} />}
        <ProviderConsoleView
          data={console}
          onBack={() => setConsole(null)}
          onAction={(op) => handleAction(console.provider_id, op)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-baic-bg">
      {toast && <Toast message={toast} />}
      {error && (
        <div className="bg-red-900/40 p-2 text-center text-sm text-red-200">{error}</div>
      )}

      <header className="border-b border-baic-border bg-baic-panel px-4 py-3">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
          <h1 className="text-sm font-bold tracking-wide text-cyan-300">
            BAIC CONTROL PLANE · GLOBAL LIQUIDITY POOL
          </h1>
          <span className="badge-active">{hub?.portfolio_status ?? "LOADING…"}</span>
        </div>
      </header>

      {hub && (
        <main className="mx-auto max-w-6xl space-y-6 p-4">
          <KpiStrip hub={hub} />

          <section>
            <h2 className="mb-3 text-xs font-semibold text-gray-500">CONSUMER FRONTENDS & SUBSCRIPTIONS</h2>
            <div className="card-grid">
              {hub.consumer_cards.map((c) => (
                <ProviderCardView
                  key={c.provider_id}
                  card={c}
                  onOpen={openProvider}
                  onAction={handleAction}
                />
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xs font-semibold text-gray-500">INFRASTRUCTURE EXTRACTION NODES</h2>
            <div className="card-grid md:grid-cols-2">
              {hub.infra_cards.map((c) => (
                <ProviderCardView
                  key={c.provider_id}
                  card={c}
                  onOpen={openProvider}
                  onAction={handleAction}
                />
              ))}
            </div>
          </section>

          <section className="panel">
            <h2 className="mb-2 text-xs font-semibold text-gray-500">ENTITY REGISTRY PIPELINE (DIRT ENGINE)</h2>
            <div className="max-h-32 space-y-1 overflow-y-auto font-mono text-xs text-gray-400">
              {hub.dirt_events.map((e, i) => (
                <div key={i}>
                  [{e.level}] {e.message}
                </div>
              ))}
            </div>
          </section>
        </main>
      )}
    </div>
  );
}

function KpiStrip({ hub }: { hub: HubSummary }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <Kpi label="GLOBAL EST. RUNWAY" value={`${hub.global_runway_months} MONTHS`} />
      <Kpi label="OUT-OF-POCKET SPEND" value={`$${hub.out_of_pocket_monthly.toFixed(2)}/MO`} />
      <Kpi label="TOTAL ACTIVE LIQUIDITY (USD)" value={`$${hub.total_liquidity_usd.toLocaleString()}`} />
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel text-center">
      <div className="text-[10px] text-gray-500">{label}</div>
      <div className="text-lg font-bold text-cyan-300">{value}</div>
    </div>
  );
}

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 rounded border border-cyan-500/30 bg-baic-panel px-4 py-2 text-sm text-cyan-200 shadow-xl">
      {message}
    </div>
  );
}
