import type { ProvenanceMeta } from "../api";

type Props = {
  children: React.ReactNode;
  provenance?: ProvenanceMeta | null;
  className?: string;
};

export function ProvenanceHotspot({ children, provenance, className = "" }: Props) {
  if (!provenance) {
    return <span className={className}>{children}</span>;
  }

  const title = buildTooltip(provenance);

  return (
    <span
      className={`provenance-hotspot cursor-help border-b border-dotted border-cyan-500/40 ${className}`}
      title={title}
      tabIndex={0}
    >
      {children}
    </span>
  );
}

export function buildTooltip(p: ProvenanceMeta): string {
  const lines = [p.summary];
  if (p.input) lines.push(`Input: ${p.input}`);
  if (p.stored_in) lines.push(`Stored in: ${p.stored_in}`);
  if (p.output) lines.push(`Output: ${p.output}`);
  if (p.feeds) lines.push(`Feeds: ${p.feeds}`);
  if (p.run_timing) lines.push(`Run timing: ${p.run_timing}`);
  if (p.source) lines.push(`Source: ${p.source}`);
  if (p.learn_more_url) lines.push(`More: ${p.learn_more_url}`);
  if (p.stale_seed_warning) lines.push("⚠ Stale demo seed suspected — delete output/baic_state.db");
  return lines.join("\n");
}

export function unwrapField<T>(v: T | { value: T; provenance?: ProvenanceMeta } | undefined | null): {
  value: T | null | undefined;
  provenance?: ProvenanceMeta;
} {
  if (v != null && typeof v === "object" && "value" in v) {
    const o = v as { value: T; provenance?: ProvenanceMeta };
    return { value: o.value, provenance: o.provenance };
  }
  return { value: v as T | null | undefined };
}

export function displayValue(v: unknown): string {
  const { value } = unwrapField(v);
  if (value == null || value === "") return "—";
  if (typeof value === "number") return value.toLocaleString();
  return String(value);
}
