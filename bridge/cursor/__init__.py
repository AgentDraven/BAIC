from bridge.factory import make_bridge

Bridge = make_bridge(
    "cursor_pro",
    {
        "balance_summary": "5% Rest (Locked)",
        "detail": "Routing: API Disabled",
        "cta": "TROUBLESHOOT SYNC",
        "operations": ["troubleshoot_sync"],
        "op_messages": {"troubleshoot_sync": "Cursor sync diagnostic started"},
    },
)
