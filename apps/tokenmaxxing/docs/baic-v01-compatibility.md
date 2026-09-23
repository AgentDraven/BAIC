# BAIC v01 compatibility and tokenmaxxing measurement

BAIC working identity: the pulled repository `falkoro/tokenmaxxing` (the repo has no literal BAIC name). Baseline: `master` at `11c2784`, version `0.7.14`, Windows/Linux Tauri app, plugin schema version `1`.

## v01 compatibility contract

The existing plugin and local API contracts remain valid. Plugins may now return an optional `metrics` array in `probe()` output. Each item has:

- `key`: stable name, such as `tokens.total`, `tokens.input`, `tokens.output`, `requests.completed`, or `cost.estimated`.
- `value` and `unit`: non-negative numeric value and one of `tokens`, `requests`, `dollars`, `seconds`, `items`, or normalized `ratio`.
- `model`: optional model identifier.
- `source`: `provider`, `local-log`, or `estimated`.
- `confidence`: optional `0..1` value.
- `resetsAt`, `periodDurationMs`, and `sourceUrl`: optional reset-window and evidence provenance metadata.

The native runtime validates the array and the local API persists it with snapshots. Invalid optional metrics are discarded with a warning; normal line metrics still render. This is additive compatibility, not a claim that every provider exposes token data.

Claude and Codex now emit `tokens.total`, `tokens.model`, and (when available) `cost.estimated` from their local ccusage data. Z.ai emits provider-reported session and weekly token used/limit metrics. MiniMax emits provider-reported prompt request used/limit metrics when its API returns prompt counts. Copilot emits provider-backed normalized utilization ratios for its paid and free quota buckets. Antigravity emits provider-backed, model-attributed quota utilization ratios. `tokens.model` is a breakdown and must not be added to `tokens.total`; consumers should use the stable `key` when aggregating.

The native runtime also derives quota metrics from provider progress lines: count and dollar lines produce `quota.*.used/limit`, while percent lines produce a `quota.*.utilization` ratio. These are provider quota signals, not token measurements, and explicit plugin metrics take precedence.

Run `npm run metrics:coverage` to audit provider coverage. It reports explicit structured metrics, runtime-derived quota coverage, line-only providers, and source-level coverage for the capacity/model/cost/reset/provenance dimensions separately; this prevents a provider count from being misreported as token-level coverage. The dimension counts are a prioritization signal, not proof that a live account exposes the field.

## Metrics required for a credible product

Raw tokens are a capacity signal, not a productivity result. Track these dimensions per provider, model, workspace, and time window:

1. Capacity: tokens used, tokens remaining, reset time, request count, context-window utilization, and subscription/credit limit.
2. Efficiency: useful output per 1k tokens, cache-read ratio, retry/rework tokens, latency, and cost-equivalent spend.
3. Outcome: task completion, accepted diff rate, test-pass rate, rollback rate, review defects, and time-to-merge.
4. Reliability: refresh success, stale age, auth failures, provider errors, missing-data rate, and measurement confidence.
5. Access: tokens per dollar, usable tokens before reset, plan/model availability, and exhaustion incidents.

Minimum benchmark: run the same small task suite across models and subscriptions; record tokens, wall time, tests, human acceptance, rework, and estimated cost. Report medians and p90s. Do not rank a model on token volume alone.

The reusable [`summarizeBenchmark`](../src/lib/benchmark-metrics.ts) helper implements that minimum: it rejects malformed measurements, reports acceptance and test-pass rates, median/p90 token and wall-time cost, median rework, tokens per accepted task, and cost per accepted task. The [v01 benchmark suite](benchmark-suite.v01.json) supplies repeatable routine, complex, and critical tasks with acceptance gates. Run `npm run benchmark:validate -- path/to/results.json` before summarizing; it rejects malformed records and candidates with fewer than three runs. This gives lower-subscription decisions a measurable objective: maximize accepted work per dollar while preserving enough headroom for verification and recovery.

## Lower-subscription playbook

- Use the cheapest capable model for classification, search, formatting, test scaffolding, and small edits.
- Reserve the strongest model for architecture, ambiguous debugging, security-sensitive changes, and final review.
- Prefer models with predictable quotas and visible reset windows; a high nominal limit is not useful if refresh or auth data is missing.
- Batch related context, use repository summaries, and ask for concise diffs to preserve credits for verification loops.
- Set a per-task token budget and stop conditions. Avoid exploratory “spicy” model switching until the task, expected output, and rollback path are clear.
- Compare plans using usable completed tasks per dollar, not advertised context length or raw tokens.
- Use the built-in ranking utility for routing: `routine` work can use a basic model, `complex` work requires at least standard capability, and `critical` work requires frontier capability. Candidates over budget or with insufficient observed capacity are excluded. The score weights task success (45%), quota headroom (30%), estimated tasks remaining (20%), and latency (5%).

The ranking utility intentionally requires observed inputs: monthly price, included units, remaining fraction, task success rate, and average units per task. It can additionally use cost per accepted task and measurement confidence; candidates below 0.6 confidence or below the default 10% quota reserve are excluded. The reserve protects credits for verification, retries, and recovery. If the core measurements are missing, do not fabricate a recommendation; show “insufficient evidence” and keep the user on the currently selected model.

For repeatable local use, `npm run model:recommend -- candidates.json routine 15` reads a JSON array (or `{ "candidates": [...] }`) matching the [v01 candidate schema](model-candidates.v01.schema.json) and prints the top five eligible candidates. The command is intentionally advisory: it does not switch a provider, spend credits, or treat a missing measurement as zero.

Provider-specific controls change. Research refreshed 2026-09-12: GitHub documents that Copilot AI-credit usage varies by model and token volume, with 1 AI credit equal to $0.01; code completions and next-edit suggestions remain outside AI-credit billing on paid plans, while chat, agent, CLI, and code review can consume credits. GitHub also recommends reading model prices at runtime rather than hard-coding them. OpenAI says ChatGPT limits vary by plan and model and can change over time. Anthropic says message capacity varies by plan and is affected by message length, conversation length, tools, model, effort, and caching; its usage page exposes session and weekly reset windows. BAIC should therefore store the observed plan, model, limit type, reset time, cache signal, and source URL with each measurement instead of hard-coding a universal “best” subscription. See the [GitHub plan comparison](https://github.com/features/copilot/plans), [GitHub model pricing](https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing), [GitHub usage/billing metrics](https://docs.github.com/en/copilot/how-tos/copilot-sdk/features/usage-and-billing), [OpenAI plan FAQ](https://help.openai.com/en/articles/12677804-what-is-chatgpt-faq), and [Anthropic usage-limit guidance](https://support.anthropic.com/en/articles/9797557-usage-limit-best-practices).

## Adoption-critical gaps

The current source audit covers 18 plugins: 6 explicitly emit structured metrics and 12 expose progress lines eligible for runtime-derived quota metrics. This is source-level coverage only; it does not prove that credentials are available or that a live provider probe succeeds. Gaps to close before claiming broad adoption are live-provider coverage parity, model-level attribution, benchmark samples, accessibility, and a verified onboarding path. Market leadership is not measurable from this repo alone; establish it with the privacy-preserving [adoption measurement specification](adoption-measurement.md) or comparable public data, and publish the denominator.

The v01 implementation now includes bounded local history (1,000 points) through `/v1/metrics/history`, versioned JSON interchange through `GET /v1/metrics/export` and `POST /v1/metrics/import`, and `DELETE /v1/metrics/history` for explicit local erasure. Cross-device sync remains future work so local privacy stays the default.
## Committed-action measurement

BAIC also implements the shared MERIT action contract in [BAIC docs/merit-cost-action-contract.md](../BAIC%20docs/merit-cost-action-contract.md). Manual and retry refreshes are tracked as committed user actions even when all selected providers run locally and no API call occurs. Each record separates interaction evidence from provider usage and cost evidence; automatic/background probes remain excluded.
