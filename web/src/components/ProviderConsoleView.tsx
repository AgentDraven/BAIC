import { CostGauge } from "./CostGauge";
import { ModelMatrixBlock } from "./ModelMatrixBlock";
import { displayValue, ProvenanceHotspot, unwrapField } from "./ProvenanceHotspot";
import type { ProviderConsole, SpokeBlock, SpokeOperation } from "../api";

type Props = {
  data: ProviderConsole;
  onBack: () => void;
  onAction: (op: string) => void;
};

export function ProviderConsoleView({ data, onBack, onAction }: Props) {
  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-baic-border pb-4">
        <div>
          <button type="button" className="text-xs text-cyan-400 hover:underline" onClick={onBack}>
            ← BACK TO HUB
          </button>
          <h1 className="mt-1 text-lg font-bold text-cyan-200">{data.display_name}</h1>
        </div>
        {data.header && data.header.length > 0 && (
          <div className="text-right text-xs text-gray-500">
            {data.header.map((h) => {
              const { value, provenance } = unwrapField(h.display);
              return (
                <div key={h.id}>
                  {h.label}:{" "}
                  <ProvenanceHotspot provenance={provenance}>{displayValue(value)}</ProvenanceHotspot>
                </div>
              );
            })}
          </div>
        )}
      </header>

      {data.blocks.map((block) => (
        <SpokeBlockView key={block.id} block={block} onAction={onAction} providerId={data.provider_id} />
      ))}

      {data.metrics_provenance?.stale_seed_warning && (
        <div className="rounded border border-amber-500/40 bg-amber-900/20 p-3 text-xs text-amber-200">
          Stale demo metrics detected in SQLite without configured credentials. Delete{" "}
          <code className="text-amber-100">output/baic_state.db</code> for a clean live state, or run with{" "}
          <code className="text-amber-100">--stub</code> intentionally.
        </div>
      )}
    </div>
  );
}

function SpokeBlockView({
  block,
  onAction,
  providerId,
}: {
  block: SpokeBlock;
  onAction: (op: string) => void;
  providerId: string;
}) {
  if (block.template === "pxm_matrix") {
    return <ModelMatrixBlock providerId={providerId} />;
  }

  if (block.template === "dual_axis_cost" && block.guardrails) {
    const cost = unwrapField(block.guardrails.current_cost);
    const cap = unwrapField(block.guardrails.spend_cap);
    const label = unwrapField(block.guardrails.label);
    return (
      <CostGauge
        currentCost={Number(cost.value ?? 0)}
        spendCap={Number(cap.value ?? 15)}
        label={String(label.value ?? providerId)}
        costProvenance={cost.provenance}
        capProvenance={cap.provenance}
      />
    );
  }

  if (block.template === "ai_studio_sandbox") {
    return (
      <section className="panel space-y-3">
        <h2 className="text-sm font-semibold text-gray-300">{block.title}</h2>
        <div className="grid gap-4 text-xs md:grid-cols-3">
          <div>
            <div className="mb-1 text-gray-500">PROJECTS</div>
            {(block.projects ?? []).length === 0 && <div className="text-gray-600">—</div>}
            {(block.projects ?? []).map((p, i) => {
              const { value, provenance } = unwrapField(p);
              return (
                <div key={i} className="text-cyan-200">
                  [•]{" "}
                  <ProvenanceHotspot provenance={provenance}>{displayValue(value)}</ProvenanceHotspot>
                </div>
              );
            })}
          </div>
          <div>
            <div className="mb-1 text-gray-500">QUOTA CEILING</div>
            <ProvenanceHotspot provenance={unwrapField(block.tpm_ceiling).provenance}>
              {Number(unwrapField(block.tpm_ceiling).value ?? 0).toLocaleString()} TPM
            </ProvenanceHotspot>
          </div>
        </div>
      </section>
    );
  }

  if (block.template === "promo_guardrails" || block.template === "compute_capacity") {
    return (
      <section className="panel space-y-3">
        <h2 className="text-sm font-semibold text-gray-300">{block.title}</h2>
        <div className="grid gap-4 text-xs md:grid-cols-3">
          {block.promo_pools && (
            <div>
              <div className="mb-1 text-gray-500">PROMO POOLS</div>
              {block.promo_pools.map((p) => {
                const bal = unwrapField(p.balance);
                const exp = unwrapField(p.expires);
                return (
                  <div key={p.name} className="text-green-400">
                    [•] {p.name}:{" "}
                    <ProvenanceHotspot provenance={bal.provenance}>${displayValue(bal.value)}</ProvenanceHotspot>
                    {" — exp "}
                    <ProvenanceHotspot provenance={exp.provenance}>{displayValue(exp.value)}</ProvenanceHotspot>
                  </div>
                );
              })}
            </div>
          )}
          {block.guardrails && (
            <div>
              <div className="mb-1 text-gray-500">GUARDRAILS</div>
              <GuardrailLine label="Run" field={block.guardrails.current_cost} prefix="$" />
              <GuardrailLine label="Cap" field={block.guardrails.spend_cap} prefix="$" />
              <GuardrailLine label="Auto-swap @" field={block.guardrails.auto_swap_at_tpm_pct} suffix="% TPM" />
            </div>
          )}
          {block.cpu_percent !== undefined && (
            <div>
              <div className="mb-1 text-gray-500">CPU</div>
              <ProvenanceHotspot provenance={unwrapField(block.cpu_percent).provenance}>
                {displayValue(unwrapField(block.cpu_percent).value)}%
              </ProvenanceHotspot>
            </div>
          )}
          {block.memory_gb_free !== undefined && (
            <div>
              <div className="mb-1 text-gray-500">MEMORY FREE</div>
              <ProvenanceHotspot provenance={unwrapField(block.memory_gb_free).provenance}>
                {displayValue(unwrapField(block.memory_gb_free).value)} GB
              </ProvenanceHotspot>
            </div>
          )}
          {block.allowance_summary !== undefined && (
            <div>
              <div className="mb-1 text-gray-500">ALLOWANCE</div>
              <ProvenanceHotspot provenance={unwrapField(block.allowance_summary).provenance}>
                {displayValue(unwrapField(block.allowance_summary).value)}
              </ProvenanceHotspot>
            </div>
          )}
          <OperationButtons operations={block.operations} onAction={onAction} />
        </div>
      </section>
    );
  }

  return null;
}

function GuardrailLine({
  label,
  field,
  prefix = "",
  suffix = "",
}: {
  label: string;
  field: unknown;
  prefix?: string;
  suffix?: string;
}) {
  const { value, provenance } = unwrapField(field);
  const num = typeof value === "number" ? value.toFixed(2) : displayValue(value);
  return (
    <div>
      {label}:{" "}
      <ProvenanceHotspot provenance={provenance}>
        {prefix}
        {num}
        {suffix}
      </ProvenanceHotspot>
    </div>
  );
}

function OperationButtons({
  operations,
  onAction,
}: {
  operations?: SpokeOperation[];
  onAction: (op: string) => void;
}) {
  if (!operations?.length) return null;
  return (
    <div className="flex flex-wrap content-start gap-2">
      {operations.map((op) => (
        <button
          key={op.id}
          type="button"
          className="btn-primary"
          title={op.provenance ? buildOpTooltip(op) : undefined}
          onClick={() => onAction(op.id)}
        >
          {op.label}
        </button>
      ))}
    </div>
  );
}

function buildOpTooltip(op: SpokeOperation): string {
  const p = op.provenance;
  if (!p) return op.label;
  return `${p.summary}\nStored in: ${p.stored_in ?? "cfg/provider_registry.json"}`;
}
