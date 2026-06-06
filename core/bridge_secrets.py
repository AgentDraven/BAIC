"""Bridge secret specifications for config scaffold validation (MERIT §II.G)."""

from __future__ import annotations

from typing import Any

# Each entry: key in cfg/secrets.json, optional env mirror, description for examples
BRIDGE_SECRET_SPECS: dict[str, list[dict[str, str]]] = {
    "google_cloud": [
        {"key": "application_credentials", "env": "GOOGLE_APPLICATION_CREDENTIALS", "description": "Path to GCP service account JSON"},
        {"key": "project_id", "env": "GOOGLE_CLOUD_PROJECT", "description": "Default GCP project id"},
    ],
    "microsoft_azure": [
        {"key": "openai_endpoint", "env": "AZURE_OPENAI_ENDPOINT", "description": "Azure OpenAI resource endpoint URL"},
        {"key": "openai_api_key", "env": "AZURE_OPENAI_API_KEY", "description": "Azure OpenAI API key"},
    ],
    "amazon_aws": [
        {"key": "access_key_id", "env": "AWS_ACCESS_KEY_ID", "description": "AWS access key for Bedrock"},
        {"key": "secret_access_key", "env": "AWS_SECRET_ACCESS_KEY", "description": "AWS secret access key"},
        {"key": "region", "env": "AWS_DEFAULT_REGION", "description": "Bedrock region"},
    ],
    "oracle_oci": [
        {"key": "tenancy_ocid", "env": "OCI_TENANCY_OCID", "description": "OCI tenancy OCID"},
        {"key": "user_ocid", "env": "OCI_USER_OCID", "description": "OCI user OCID"},
        {"key": "fingerprint", "env": "OCI_FINGERPRINT", "description": "API key fingerprint"},
        {"key": "private_key_path", "env": "OCI_PRIVATE_KEY_PATH", "description": "Path to OCI private key PEM"},
    ],
    "cursor_pro": [
        {"key": "api_token", "env": "CURSOR_API_TOKEN", "description": "Cursor Pro API token if applicable"},
    ],
    "github_copilot": [
        {"key": "github_token", "env": "GITHUB_TOKEN", "description": "GitHub token for Copilot API"},
    ],
    "google_one_ai": [
        {"key": "oauth_client_id", "env": "GOOGLE_ONE_CLIENT_ID", "description": "Google One AI OAuth client id"},
    ],
}


def all_required_secret_keys() -> dict[str, list[str]]:
    return {pid: [s["key"] for s in specs] for pid, specs in BRIDGE_SECRET_SPECS.items()}


def example_secrets_json() -> dict[str, Any]:
    providers: dict[str, dict[str, str]] = {}
    for pid, specs in BRIDGE_SECRET_SPECS.items():
        providers[pid] = {s["key"]: f"<{s['description']}>" for s in specs}
    return {"providers": providers}
