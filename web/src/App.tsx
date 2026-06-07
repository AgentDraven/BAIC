import { useCallback, useEffect, useState } from "react";
import {
  fetchConsole,
  fetchHub,
  fetchMeta,
  fetchModelFamilies,
  runOp,
  type HubSummary,
  type ProviderConsole,
} from "./api";
import { ProviderCardView } from "./components/ProviderCardView";
import { ProviderConsoleView } from "./components/ProviderConsoleView";
import { displayValue, ProvenanceHotspot, unwrapField } from "./components/ProvenanceHotspot";
import { MobileFirstShell } from "./layouts/MobileFirstShell";

export default function App() {
  const [hub, setHub] = useState<HubSummary | null>(null);
  const [console, setConsole] = useState<ProviderConsole | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stubMode, setStubMode] = useState(false);
  const [familyFilter, setFamilyFilter] = useState<string | null>(null);
  const [families, setFamilies] = useState<string[]>([]);

  const loadHub = useCallback(async () => {
    try {
      const [h, meta] = await Promise.all([fetchHub(), fetchMeta()]);
      setHub(h);
      setStubMode(meta.stub_mode || h.stub_mode || false);
      setError(null);
    } catch (e) {
      setError(String(e));
    }
  }, []);

  useEffect(() => {
    loadHub();
    fetchModelFamilies()
      .then((f) => setFamilies(f.families.map((x) => x.family)))
      .catch(() => setFamilies([]));
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

  const filterCard = (c: { provider_id: string; title: string }) => {
    if (!familyFilter) return true;
    return c.title.toLowerCase().includes(familyFilter) || c.provider_id.includes(familyFilter);
  };

  const center = console ? (
    <ProviderConsoleView
      data={console}
      onBack={() => setConsole(null)}
      onAction={(op) => handleAction(console.provider_id, op)}
    />
  ) : (
    <>
      {error && (
        <div className="bg-red-900/40 p-2 text-center text-sm text-red-200">{error}</div>
      )}
      {hub && (
        <main className="mx-auto max-w-6xl space-y-6 p-4">
          <KpiStrip hub={hub} />

          {families.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`rounded px-2 py-1 text-xs ${!familyFilter ? "bg-cyan-500/30 text-cyan-200" : "bg-gray-800 text-gray-400"}`}
                onClick={() => setFamilyFilter(null)}
              >
                ALL
              </button>
              {families.map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`rounded px-2 py-1 text-xs capitalize ${familyFilter === f ? "bg-cyan-500/30 text-cyan-200" : "bg-gray-800 text-gray-400"}`}
                  onClick={() => setFamilyFilter(f === familyFilter ? null : f)}
                >
                  {f}
                </button>
              ))}
            </div>
          )}

          <HubSection title="SELECT CONSUMER FRONTENDS & SUBSCRIPTIONS">
            <div className="hub-grid hub-grid-3">
              {hub.consumer_cards.filter(filterCard).map((c) => (
                <ProviderCardView key={c.provider_id} card={c} onOpen={openProvider} onAction={handleAction} />
              ))}
            </div>
          </HubSection>

          <HubSection title="SELECT INFRASTRUCTURE EXTRACTION NODES">
            <div className="hub-grid hub-grid-2">
              {hub.infra_cards.filter(filterCard).map((c) => (
                <ProviderCardView key={c.provider_id} card={c} onOpen={openProvider} onAction={handleAction} />
              ))}
            </div>
          </HubSection>

          <HubSection title="ENTITY REGISTRY PIPELINE (DIRT ENGINE)">
            <div className="max-h-32 space-y-1 overflow-y-auto font-mono text-xs text-gray-400">
              {hub.dirt_events.length === 0 && (
                <div className="text-gray-600">[SYSTEM] Awaiting DIRT pipeline events…</div>
              )}
              {hub.dirt_events.map((e, i) => (
                <div key={i}>
                  [{e.level}] {e.message}
                </div>
              ))}
            </div>
          </HubSection>
        </main>
      )}
    </>
  );

  return (
    <>
      {toast && <Toast message={toast} />}
      <MobileFirstShell
        title="BAIC CONTROL PLANE · GLOBAL LIQUIDITY POOL"
        portfolioStatus={hub?.portfolio_status}
        stubMode={stubMode}
      >
        {center}
      </MobileFirstShell>
    </>
  );
}

function HubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="hub-section">
      <h2 className="hub-section-title">{title}</h2>
      <div className="hub-section-body">{children}</div>
    </section>
  );
}

function KpiStrip({ hub }: { hub: HubSummary }) {
  const runwayF = unwrapField(hub.global_runway_months);
  const oopF = unwrapField(hub.out_of_pocket_monthly);
  const liqF = unwrapField(hub.total_liquidity_usd);

  const runway =
    runwayF.value != null ? `${runwayF.value} MONTHS` : "—";
  const oop =
    typeof oopF.value === "number" && oopF.value > 0 ? `$${oopF.value.toFixed(2)}/MO` : "—";
  const liquidity =
    typeof liqF.value === "number" && liqF.value > 0 ? `$${liqF.value.toLocaleString()}` : "$0";

  return (
    <div className="hub-kpi-strip">
      <Kpi label="GLOBAL EST. RUNWAY" value={runway} provenance={runwayF.provenance} />
      <Kpi label="OUT-OF-POCKET SPEND" value={oop} provenance={oopF.provenance} />
      <Kpi label="TOTAL ACTIVE LIQUIDITY (USD)" value={liquidity} provenance={liqF.provenance} />
      {liqF.provenance?.stale_seed_warning && (
        <div className="col-span-full rounded border border-amber-500/30 bg-amber-900/10 px-3 py-2 text-[10px] text-amber-300">
          Liquidity sum includes SQLite rows from a prior --stub run. Hover KPI values for provenance, or delete{" "}
          <code>output/baic_state.db</code>.
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, provenance }: { label: string; value: string; provenance?: import("./api").ProvenanceMeta }) {
  return (
    <div className="hub-kpi">
      <div className="text-[10px] text-gray-500">[•] {label}</div>
      <div className="text-lg font-bold text-cyan-300">
        <ProvenanceHotspot provenance={provenance}>{value}</ProvenanceHotspot>
      </div>
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
