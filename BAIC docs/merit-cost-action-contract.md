# BAIC MERIT cost and action contract

BAIC implements the shared MERIT V01 measurement rule: a committed user action is measured whether or not it produces a provider/API request. A local refresh, recommendation, benchmark, export, or settings action is therefore not silently lost merely because the transport is local or `none`.

## Contract

`src/lib/action-events.ts` emits bounded, local-first `merit.telemetry.action.v1` records with:

- the stable trigger, utility, request/event id, timestamp, quantity, outcome, and transport;
- an explicit `apiCallMade` boolean, so “user asked” is not confused with “provider billed”;
- cost as a separate field with a source (`provider`, `estimated`, `local`, or `none`); local-only actions record `$0` only as a local measurement, never as provider billing proof;
- optional normalized metric keys, never prompts, content, URLs, room codes, handles, credentials, or other identifiers.

The local history is capped at 1,000 records and measurement failures are best-effort: telemetry cannot interrupt the action being measured. No hosted persistence or adoption denominator is claimed until an authenticated MERIT meter plane is configured and replay/idempotency evidence exists.

The initial BAIC trigger allow-list records explicit usage refreshes from the manual retry/refresh controls. Automatic/background probes are excluded because they are system activity, not committed user actions. Additional controls must be added deliberately with a stable trigger and tests.

This is the BAIC implementation of the L1 rule in the private MERIT instructions: measure committed user intent, preserve the no-call outcome, and keep usage, cost, and adoption claims separate.
