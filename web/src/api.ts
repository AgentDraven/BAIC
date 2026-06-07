const API = import.meta.env.VITE_API_BASE ?? "";

export type ProvenanceMeta = {
  source: string;
  summary: string;
  stored_in?: string;
  input?: string;
  output?: string;
  feeds?: string;
  run_timing?: string;
  learn_more_url?: string;
  stale_seed_warning?: boolean;
  stub?: boolean;
};

export type FieldValue<T = unknown> = {
  value: T;
  provenance?: ProvenanceMeta;
};

export type HubSummary = {
  portfolio_status: string;
  global_runway_months: FieldValue<number | null> | number | null;
  out_of_pocket_monthly: FieldValue<number> | number;
  total_liquidity_usd: FieldValue<number> | number;
  consumer_cards: ProviderCard[];
  infra_cards: ProviderCard[];
  dirt_events: { level: string; message: string }[];
  stub_mode?: boolean;
};

export type ProviderCard = {
  provider_id: string;
  title: string;
  balance_summary?: string;
  detail?: string;
  status: string;
  status_badge: string;
  cta?: string;
  operations: string[];
  kind?: string;
  console_screen?: string;
  provenance?: ProvenanceMeta;
};

export type SpokeOperation = {
  id: string;
  label: string;
  visible: boolean;
  provenance?: ProvenanceMeta;
};

export type SpokeBlock = {
  id: string;
  title?: string;
  template?: string;
  status?: string;
  projects?: Array<FieldValue<string> | string>;
  tpm_ceiling?: FieldValue<number> | number;
  promo_pools?: Array<{
    name: string;
    balance: FieldValue<number> | number;
    expires?: FieldValue<string | null> | string | null;
  }>;
  guardrails?: {
    current_cost?: FieldValue<number> | number;
    spend_cap?: FieldValue<number> | number;
    auto_swap_at_tpm_pct?: FieldValue<number> | number;
    label?: FieldValue<string> | string;
  };
  operations?: SpokeOperation[];
  cpu_percent?: FieldValue<number | null> | number | null;
  memory_gb_free?: FieldValue<number | null> | number | null;
  allowance_summary?: FieldValue<string> | string;
};

export type ProviderConsole = {
  provider_id: string;
  display_name: string;
  console_screen: string;
  hierarchy: string[];
  entities: { tier: string; name: string; path: string }[];
  metrics: Record<string, unknown>;
  metrics_provenance?: ProvenanceMeta;
  header?: Array<{ id: string; label: string; display: FieldValue<string> | string }>;
  blocks: SpokeBlock[];
  operations: string[];
  operation_details?: SpokeOperation[];
  layout_screen?: string;
};

export type CapabilityMatrix = {
  model_catalog: Record<string, { family: string; display_name: string }>;
  platforms: Record<string, PlatformModels>;
};

export type PlatformModels = {
  provider_id: string;
  models: Record<
    string,
    {
      available?: boolean;
      declared_available?: boolean;
      live_verified?: boolean;
      endpoint_key?: string;
      notes?: string;
      display_name?: string;
      provenance?: ProvenanceMeta;
    }
  >;
  matrix_provenance?: ProvenanceMeta;
};

export type XRayRuntime = {
  dashboard_events: { level: string; message: string; source?: string }[];
  request_events: { level?: string; message: string }[];
  logs: { level: string; message: string }[];
  stub_manifest?: unknown;
  stub_mode?: boolean;
};

export async function fetchMeta(): Promise<{ stub_mode: boolean }> {
  const r = await fetch(`${API}/api/v1/meta`);
  if (!r.ok) throw new Error("Meta fetch failed");
  return r.json();
}

export async function fetchHub(): Promise<HubSummary> {
  const r = await fetch(`${API}/api/v1/hub/summary`);
  if (!r.ok) throw new Error("Hub fetch failed");
  return r.json();
}

export async function fetchConsole(providerId: string): Promise<ProviderConsole> {
  const r = await fetch(`${API}/api/v1/providers/${providerId}/console`);
  if (!r.ok) throw new Error("Console fetch failed");
  return r.json();
}

export async function runOp(providerId: string, opId: string): Promise<{ ok: boolean; message?: string }> {
  const r = await fetch(`${API}/api/v1/providers/${providerId}/operations/${opId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ context: {} }),
  });
  return r.json();
}

export async function fetchCapabilityMatrix(): Promise<CapabilityMatrix> {
  const r = await fetch(`${API}/api/v1/capability/matrix`);
  if (!r.ok) throw new Error("Matrix fetch failed");
  return r.json();
}

export async function fetchPlatformModels(platformId: string): Promise<PlatformModels> {
  const r = await fetch(`${API}/api/v1/capability/platforms/${platformId}/models`);
  if (!r.ok) throw new Error("Platform models fetch failed");
  return r.json();
}

export async function fetchScaffoldStatus(): Promise<{ ok: boolean; errors: string[] }> {
  const r = await fetch(`${API}/api/v1/config/scaffold-status`);
  if (!r.ok) throw new Error("Scaffold status failed");
  return r.json();
}

export async function fetchXRayRuntime(): Promise<XRayRuntime> {
  const r = await fetch(`${API}/api/v1/xray/runtime`);
  if (!r.ok) throw new Error("X-Ray runtime failed");
  return r.json();
}

export async function postXRayEvent(level: string, message: string): Promise<void> {
  await fetch(`${API}/api/v1/xray/event`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ level, message, source: "ui" }),
  });
}

export async function fetchModelFamilies(): Promise<{ families: { family: string; models: string[] }[] }> {
  const r = await fetch(`${API}/api/v1/capability/families`);
  if (!r.ok) throw new Error("Families fetch failed");
  return r.json();
}
