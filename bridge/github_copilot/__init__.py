from bridge.factory import make_bridge

Bridge = make_bridge(
    "github_copilot",
    {
        "balance_summary": "~192k Token Cap",
        "detail": "Speed Status: SLOW (VS Code)",
        "cta": "ROUTE VIA CLINE",
        "operations": ["route_via_cline"],
        "op_messages": {"route_via_cline": "Routing profile switched to Cline"},
    },
)
