from bridge.factory import make_bridge

Bridge = make_bridge(
    "oracle_oci",
    {
        "balance_summary": "4 Ampere CPUs · 24 GB RAM",
        "detail": "Allocation for Ollama · Cron Infrastructure: SECURE",
        "cta": "MONITOR BACKGROUND TASK",
        "operations": ["enter_provider_console", "monitor_background"],
        "op_messages": {"monitor_background": "Background task monitor active"},
    },
)
