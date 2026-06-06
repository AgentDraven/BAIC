"""X-Ray event buffer and runtime aggregation (MERIT §II.H)."""

from __future__ import annotations

import threading
import time
from collections import deque
from dataclasses import dataclass, field
from typing import Any


@dataclass
class XRayEvent:
    level: str
    message: str
    source: str = "backend"
    ts: float = field(default_factory=time.time)
    context: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "level": self.level,
            "message": self.message,
            "source": self.source,
            "ts": self.ts,
            "context": self.context,
        }


class XRayBuffer:
    def __init__(self, max_lines: int = 120) -> None:
        self._events: deque[XRayEvent] = deque(maxlen=max_lines)
        self._request_events: deque[dict[str, Any]] = deque(maxlen=200)
        self._lock = threading.Lock()

    def append(self, level: str, message: str, source: str = "backend", **context: Any) -> None:
        with self._lock:
            self._events.append(XRayEvent(level=level, message=message, source=source, context=context))

    def append_request(self, method: str, path: str, status: int, duration_ms: float) -> None:
        with self._lock:
            self._request_events.append(
                {
                    "level": "HTTP",
                    "message": f"{method} {path} -> {status} ({duration_ms:.0f}ms)",
                    "method": method,
                    "path": path,
                    "status": status,
                }
            )

    def snapshot(self, dirt_events: list[dict[str, Any]] | None = None) -> dict[str, Any]:
        with self._lock:
            dashboard_events = [e.to_dict() for e in self._events]
            request_events = list(self._request_events)
        return {
            "dashboard_events": dashboard_events,
            "logs": dirt_events or [],
            "request_events": request_events,
            "stub_manifest": {},
        }


_xray_buffer: XRayBuffer | None = None


def get_xray_buffer() -> XRayBuffer:
    global _xray_buffer
    if _xray_buffer is None:
        _xray_buffer = XRayBuffer()
    return _xray_buffer
