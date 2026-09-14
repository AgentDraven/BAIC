# BAIC MERIT cost and action contract

BAIC implements the shared MERIT V01 measurement rule: committed user actions are recorded even when they do not produce a provider/API call. The `/api/v1/actions` contract is allow-listed by caller, bounded by query limits, idempotent by `event_id`, and stored in the local SQLite database.

Each event carries the stable trigger, utility, event id, timestamp, quantity, outcome, transport (`api`, `local`, or `none`), and explicit `api_call_made` flag. Cost is separate and source-labelled (`provider`, `estimated`, `local`, or `none`); local `$0` is not provider billing proof. Passive reads, renders, keystrokes, and background polling are excluded. No prompts, content, URLs, credentials, handles, room codes, or PII are accepted as event fields.

The UI records committed provider-open and provider-operation actions. Product controls that are local-only must use `transport=local` or `none` and `api_call_made=false`. Hosted forwarding and adoption claims remain unverified until the canonical MERIT meter plane has authenticated first-write and idempotent replay evidence.
