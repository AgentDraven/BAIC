#!/usr/bin/env python3
"""BAIC operations entry point (MERIT §II.A)."""

from __future__ import annotations

import argparse
import sys
import webbrowser
from pathlib import Path

# Ensure repo root on sys.path
_ROOT = Path(__file__).resolve().parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

import uvicorn
from core.api.app import create_app
from core.config_loader import AppConfig


def main() -> int:
    parser = argparse.ArgumentParser(description="Run BAIC TokenMaxxing Control Plane")
    parser.add_argument("--host", default=None, help="API host (default from cfg/config.json)")
    parser.add_argument("--port", type=int, default=None, help="API port (default from cfg/config.json)")
    parser.add_argument("--no-browser", action="store_true", help="Do not open browser on start")
    parser.add_argument("--reload", action="store_true", help="Dev auto-reload")
    args = parser.parse_args()

    config = AppConfig.load()
    host = args.host or config.api_host
    port = args.port or config.api_port
    app = create_app(config)

    url = f"http://{host}:{port}/"
    print(f"[BAIC] Starting {config.app_name}")
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
