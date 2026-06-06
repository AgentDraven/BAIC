# Provider bridges

Each cloud or LLM provider implements specialized integration code under **`bridge/<provider>/`**, not inside `core/` phase modules.

- **Admin** adds or configures providers via `cfg/provider_registry.json` (hierarchy, display names, metrics profile).
- **Developer** implements or extends `bridge/<provider>/` when JSON configuration alone is insufficient.

See **§6–§7** in [BAIC docs/input/BAIC_PRD.md](../BAIC%20docs/input/BAIC_PRD.md) for the contract, registry schema, and extension checklist.

MERIT rule: bridges read config from `cfg/`; secrets live in `.env.local` or gitignored `cfg/secrets.json` — never in bridge source.
