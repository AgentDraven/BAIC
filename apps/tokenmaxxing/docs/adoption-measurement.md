# BAIC adoption measurement (v01)

BAIC must not claim to be the most widely used token-maxxing tool without a denominator. This specification defines an opt-in measurement path that can establish reach while keeping usage content and credentials local.

## What to count

Publish monthly, with the reporting window and release channel:

- active installations: distinct random installation IDs that open BAIC at least once;
- returning installations: installations seen in a prior window;
- enabled providers: provider IDs only, never credentials or account IDs;
- completed benchmark runs: task class and aggregate outcome only;
- recommendation usage: task class, budget band, and whether the user accepted or dismissed the recommendation;
- retained installations: installations seen in the next reporting window.

Report the denominator and collection rate beside every percentage. “Provider coverage” is not “user coverage,” and source-level plugin counts are not adoption evidence.

## Privacy boundary

The opt-in event payload may contain only:

```json
{
  "schemaVersion": "v01",
  "event": "active|returning|benchmark_completed|recommendation",
  "installationId": "random-rotatable-id",
  "release": "0.7.14",
  "platform": "windows|macos|linux",
  "providerIds": ["claude"],
  "taskClass": "routine",
  "budgetBand": "0-15|15-30|30+",
  "accepted": true
}
```

Never send prompts, source code, file paths, token values, raw usage history, account identifiers, plan credentials, or exact spend. Rotate the installation ID on uninstall or at a documented interval. Keep the default off, provide a visible opt-in toggle, and provide export/delete controls for locally retained events.

The [`adoption-events`](../src/lib/adoption-events.ts) helper enforces this payload boundary in code. It is side-effect free and does not transmit or persist anything; a future collector must still provide explicit opt-in, retention, export, and deletion behavior.

## Evidence gates

Before publishing an adoption claim:

1. document the collection period, release, platforms, opt-in rate, and event counts;
2. deduplicate only by the rotated installation ID and disclose the method;
3. publish confidence intervals or clearly label the result as descriptive telemetry;
4. separate active installations from downloads, stars, forks, and benchmark participants;
5. do not compare against another product unless its denominator and collection method are comparable.

Until these gates are met, use the narrower statements “v01-compatible,” “source-audited,” or “benchmark-ready.”
