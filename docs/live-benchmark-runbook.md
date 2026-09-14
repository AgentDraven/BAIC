# Live v01 benchmark runbook

Use this runbook when credentials and provider access are available. It is intentionally provider-neutral: BAIC must record observed evidence, not infer a universal quota from a plan name.

## Before running

1. Choose one provider, model, plan, and task class.
2. Confirm the provider account is authenticated and that the usage/reset view is visible.
3. Record the starting quota snapshot through BAIC or the provider UI.
4. Keep the repository revision, benchmark-suite revision, platform, and run date.
5. Do not place tokens, cookies, prompts containing secrets, or account identifiers in the result file.

## Run protocol

For each candidate, run the matching task from [`benchmark-suite.v01.json`](benchmark-suite.v01.json) three times under the same task class. For each run, record:

- provider, model, and subscription plan;
- total tokens or provider-equivalent units;
- wall-clock time;
- whether automated tests passed;
- whether the result was accepted without substantive rework;
- rework units and estimated cost when available;
- the measurement source and confidence in the accompanying notes, not secrets.

Use the same acceptance gate for every candidate. Do not switch models halfway through a run. If authentication, quota refresh, or provider state changes, discard that run and record the reason outside the benchmark data.

## Evidence gate

Validate the collected JSON or JSONL before analysis:

```text
npm run benchmark:validate -- results.json
```

The validator rejects malformed records and candidates with fewer than three runs. Only after it passes should you aggregate results and create candidate records matching [`model-candidates.v01.schema.json`](model-candidates.v01.schema.json).

## Routing step

Use the measured candidates with the conservative recommender:

```text
npm run model:recommend -- candidates.json routine 15
```

The command excludes candidates that do not meet the task tier, budget, confidence, or protected 10% headroom reserve. An empty recommendation is valid evidence that more measurement is needed; do not override it by guessing.

## Publishable evidence

Keep the raw benchmark file local unless every field has been reviewed for sensitive content. A publishable report should contain medians and p90s, acceptance and test-pass rates, tokens/cost per accepted task, candidate sample counts, provider/model/plan labels, and the exact benchmark and software revisions.
