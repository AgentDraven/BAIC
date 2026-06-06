# README

## Welcome to the TokenMaxxing2Zero Tracker (T2Z)!

This project is part of the **Bay Area Inference Club (BAIC)** initiative, focused on optimizing token usage and minimizing operational costs for AI-driven workflows.

## Getting Started

For initial setup and Git repository initialization, please refer to the [Bootstrapping Guide](docs/BOOTSTRAPPING.md).

## Documentation

- [Product Requirements Document (PRD), High-Level Design (HLD), Low-Level Design (LLD)](docs/input/BAIC_PRD.md)
- [BAIC Theme and Brand Strategy](docs/BAIC_theme.md)

## Project Structure

```
BAIC/
├── run_baic.py             # Main entry (operations)
├── test_baic.py            # Test entry (unified test runner)
├── README.md
├── VERSION
├── CHANGELOG.md
│
├── core/
│   ├── path_resolver.py
│   ├── error_codes.py
│   ├── admin_console.py
│   └── *.py                # Support modules
│
├── scripts/
│   └── *.py                # Utilities
│
├── tests/
│   ├── conftest.py
│   └── *.py                # General tests
│
├── cfg/                    # Single source of truth
│   ├── theme.md            # Brand voice & strategy
│   ├── llm_providers.json  # API configuration
│   └── paths.json          # Optional path config
│
├── docs/
│   ├── BOOTSTRAPPING.md    # Initial setup guide
│   ├── BAIC_theme.md       # BAIC-specific theme and brand strategy
│   ├── CONFIG_REFERENCE.md
│   ├── TECHNICAL_HLD_LLD.md
│   ├── guides/
│   ├── architecture/
│   │   └── mermaid/
│   └── research/
│
└── output/
    └── analytics/          # Performance reports
```
