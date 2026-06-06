const API = import.meta.env.VITE_API_BASE ?? "";

export type HubSummary = {
  portfolio_status: string;
  global_runway_months: number;
  out_of_pocket_monthly: number;
  total_liquidity_usd: number;
  consumer_cards: ProviderCard[];
  infra_cards: ProviderCard[];
  dirt_events: { level: string; message: string }[];
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
