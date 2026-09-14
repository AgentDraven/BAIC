# BAIC v01 completion matrix

This matrix is the acceptance boundary for the current `tokenmaxxing` baseline. It prevents local tests or source inspection from being mistaken for live-provider or market-adoption proof.

| Requirement | Current evidence | Status | Remaining proof |
| --- | --- | --- | --- |
| Pulled BAIC candidate repository | `falkoro/tokenmaxxing`, `master`, baseline `11c2784` | PASS | None for repository identity |
| Additive v01 metric contract | Plugin schema, native validation, unit/confidence/source/reset fields | PASS | Full native runtime execution on a permitted host |
| Persist and exchange metrics | Local history, export/import/delete routes and tests | PASS | Cross-device sync is intentionally not part of v01 |
| Provider measurement coverage | 18-provider source audit; 6 explicit, 12 derived-quota | PASS (source-level) | Authenticated probe results for each provider |
| Model attribution | Claude/Codex local-log breakdowns and Antigravity model quota metrics | PARTIAL | More live providers with model identity and stable billing attribution |
| Cost measurement | Claude/Codex estimated cost and provider request metrics | PARTIAL | Provider-reported or runtime price data for remaining providers |
| Outcome measurement | Benchmark run type, acceptance, tests, rework, latency, cost-per-accepted-task | PASS (framework) | At least three live runs per candidate |
| Lower-subscription routing | Tier, budget, confidence, cost, and 10% headroom gates; CLI recommender | PASS (decision logic) | Candidate input from live validated results |
| Benchmark evidence quality | JSON/JSONL validator rejects malformed and under-sampled candidates | PASS | Real provider result files |
| Adoption measurement | Opt-in privacy schema, sanitizer, denominator/reporting specification | PASS (design and boundary) | Opt-in installation events and published denominator |
| “Most widely used” claim | No fabricated market metric | NOT CLAIMED | Comparable public or opt-in adoption data |

The collection procedure for the remaining live evidence is defined in the [live benchmark runbook](live-benchmark-runbook.md).

## Release interpretation

BAIC can be described today as v01-compatible, source-audited, benchmark-ready, and conservative for lower-subscription routing. It cannot yet be described as live-provider-complete or the most widely used tool. Those claims require the remaining proof in the final column.
