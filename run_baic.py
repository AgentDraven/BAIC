#!/usr/bin/env python3
"""BAIC operations entry point (MERIT §II.A)."""

from __future__ import annotations

import argparse
import sys
import webbrowser
from pathlib import Path

_ROOT = Path(__file__).resolve().parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

import uvicorn
from core.api.app import create_app
from core.config_loader import AppConfig
from core.config_scaffold import validate_scaffold_or_raise


def main() -> int:
    parser = argparse.ArgumentParser(description="Run BAIC TokenMaxxing Control Plane")
    parser.add_argument("--host", default=None, help="API host (default from cfg/config.json)")
    parser.add_argument("--port", type=int, default=None, help="API port (default from cfg/config.json)")
    parser.add_argument("--no-browser", action="store_true", help="Do not open browser on start")
    parser.add_argument("--reload", action="store_true", help="Dev auto-reload")
    parser.add_argument(
        "--stub",
        action="store_true",
        help="Opt-in stub mode: demo seed data and synthetic bridge responses (MERIT §II.G)",
    )
    parser.add_argument(
        "--validate-config",
        action="store_true",
        help="Validate cfg examples against bridge secret specs and exit",
    )
    args = parser.parse_args()

    if args.validate_config:
        report = validate_scaffold_or_raise()
        print("[BAIC] Config scaffold OK")
        if report.warnings:
            for w in report.warnings:
                print(f"  warn: {w}")
        return 0

    config = AppConfig.load()
    host = args.host or config.api_host
    port = args.port or config.api_port
    app = create_app(config, stub_mode=args.stub)

    url = f"http://{host}:{port}/"
    print(f"[BAIC] Starting {config.app_name}")
    print(f"[BAIC] stub_mode={'ON' if args.stub else 'OFF'}")
    print(f"[BAIC] API + UI: {url}")
    print(f"[BAIC] Database: {config.database.engine} ({config.database.path})")

    if not args.no_browser:
        try:
            webbrowser.open(url)
        except OSError:
            pass

    uvicorn.run(app, host=host, port=port, reload=args.reload)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
