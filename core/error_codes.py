"""Structured error codes for BAIC (MERIT §I.A)."""

from __future__ import annotations

from enum import StrEnum


class ErrorCode(StrEnum):
    CONFIG_NOT_FOUND = "E001"
    CONFIG_INVALID = "E002"
    DB_CONNECTION_FAILED = "E003"
    PROVIDER_NOT_FOUND = "E004"
    BRIDGE_LOAD_FAILED = "E005"
    HIERARCHY_INVALID = "E006"
    QUOTA_EXCEEDED = "E007"
    AUTH_FAILED = "E008"
    OPERATION_UNSUPPORTED = "E009"


class BaicError(Exception):
    def __init__(self, code: ErrorCode, message: str) -> None:
        self.code = code
        self.message = message
        super().__init__(f"[{code.value}] {message}")
