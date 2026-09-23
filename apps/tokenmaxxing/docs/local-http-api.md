# Local HTTP API

OpenUsage exposes a read-only HTTP API on the loopback interface so other local apps can consume the same usage data shown in the menu bar.

**Base URL:** `http://127.0.0.1:6736`

The server starts automatically with the app. If the port is already in use, the feature is silently disabled for that session.

## Routes

### `GET /v1/usage`

Returns an array of cached usage snapshots for all **enabled** providers, ordered by your plugin settings.

- **200 OK** — JSON array (may be empty `[]` if no cached data exists yet).

### `GET /v1/usage/:providerId`

Returns a single cached usage snapshot for the given provider.

- **200 OK** — JSON object with cached snapshot.
- **204 No Content** — Provider is known but has no cached snapshot yet.
- **404 Not Found** — Provider ID is unknown.

### `GET /v1/metrics`

Returns a v01 aggregate for enabled, cached providers. It reports provider freshness, evidence quality, and sums by unit. It does not infer tokens from display text and does not merge estimated values into verified usage.

```json
{
  "schemaVersion": "v01",
  "providerCount": 3,
  "freshProviderCount": 2,
  "staleProviderCount": 1,
  "metricCount": 4,
  "verifiedMetricCount": 3,
  "estimatedMetricCount": 1,
  "valuesByUnit": { "tokens": 9200000, "dollars": 5.17 }
}
```

### `GET /v1/metrics/history`

Returns up to 1,000 locally persisted structured metric snapshots, oldest first. The history contains provider IDs and metric values only; prompts, source text, and credentials are not stored by this feature.

### `DELETE /v1/metrics/history`

Deletes all locally retained structured-metric history and returns `204 No Content`. Use this retention control before sharing or removing a device.

### `GET /v1/metrics/export`

Returns a versioned v01 JSON export containing the local history points and export timestamp. The export includes provider IDs and structured metric values only; prompts, source text, and credentials are excluded.

```json
{
  "schemaVersion": "v01",
  "exportedAt": "2026-09-12T12:00:00Z",
  "points": []
}
```

### `POST /v1/metrics/import`

Accepts the same v01 JSON document returned by the export endpoint. Valid points are merged into local history, capped at 1,000 points, and persisted. Invalid schema or metric values are rejected with `400 Bad Request`; successful imports return `{ "importedPoints": N }`.

### Unsupported methods

Any method other than the route-specific methods (`GET`, `DELETE`, or `OPTIONS`) returns **405 Method Not Allowed**.

Unknown routes return **404 Not Found**.

## Response Shape

```json
{
  "providerId": "claude",
  "displayName": "Claude",
  "plan": "Team 5x",
  "lines": [
    {
      "type": "progress",
      "label": "Session",
      "used": 42.0,
      "limit": 100.0,
      "format": { "kind": "percent" },
      "resetsAt": "2026-03-26T13:00:00.161Z",
      "periodDurationMs": 18000000,
      "color": null
    },
    {
      "type": "text",
      "label": "Today",
      "value": "$5.17 \u00b7 9.2M tokens",
      "color": null,
      "subtitle": null
    },
    {
      "type": "barChart",
      "label": "Usage Trend",
      "points": [
        { "label": "3/25", "value": 1200000.0, "valueLabel": "1.2M tokens" },
        { "label": "3/26", "value": 2400000.0, "valueLabel": "2.4M tokens" }
      ],
      "note": "Estimated from local logs",
      "color": null
    }
  ],
  "metrics": [
    {
      "key": "tokens.total",
      "value": 9200000,
      "unit": "tokens",
      "model": "claude-sonnet",
      "source": "local-log",
      "confidence": 1
    }
  ],
  "fetchedAt": "2026-03-26T11:16:29Z"
}
```

The `lines` array uses the same metric line types as the internal plugin output: `progress`, `text`, `badge`, and `barChart`.

`fetchedAt` is an ISO 8601 timestamp indicating when the snapshot was last successfully fetched.

`metrics` is optional v01 structured evidence. Existing plugins remain compatible without it. `source` distinguishes provider-reported values, local-log values, and estimates; consumers must not treat estimates as verified usage.

`iconUrl` is intentionally omitted from the API response to keep payloads small.

## Filtering and Caching Behavior

- The collection endpoint (`/v1/usage`) returns **enabled providers only**, in the order defined by your plugin settings.
- Only **successful** probe results are cached. A failed probe never overwrites a previous successful snapshot.
- The single-provider endpoint (`/v1/usage/:providerId`) works for any known provider, including disabled ones.

## CORS

All responses include permissive CORS headers:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

`OPTIONS` requests return **204 No Content** with these headers for preflight support.

## Error Responses

Error responses use this shape:

```json
{
  "error": "provider_not_found"
}
```

Possible error codes: `provider_not_found`, `not_found`, `method_not_allowed`, `server_busy`.

`server_busy` returns **503 Service Unavailable** when the local API is already handling the maximum number of concurrent connections. Clients should back off and retry later.
