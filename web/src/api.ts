const API = import.meta.env.VITE_API_BASE ?? "";

export type HubSummary = {
  portfolio_status: string;
  global_runway_months: number;
  out_of_pocket_monthly: number;
  total_liquidity_usd: number;
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
};

export type ProviderConsole = {
  provider_id: string;
  display_name: string;
  console_screen: string;
  hierarchy: string[];
  entities: { tier: string; name: string; path: string }[];
  metrics: Record<string, unknown>;
  blocks: Block[];
  operations: string[];
};

export type Block = {
  id: string;
  title: string;
  status?: string;
  projects?: string[];
  tpm_ceiling?: number;
  pricing_matrix?: Record<string, number>;
  promo_pools?: { name: string; balance: number; expires?: string }[];
  guardrails?: { current_cost: number; spend_cap: number; auto_swap_at_tpm_pct: number };
  metrics?: Record<string, unknown>;
};

export type CapabilityMatrix = {
  model_catalog: Record<string, { family: string; display_name: string }>;
  platforms: Record<string, PlatformModels>;
};

export type PlatformModels = {
  provider_id: string;
  models: Record<string, { available?: boolean; endpoint_key?: string; notes?: string }>;
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
