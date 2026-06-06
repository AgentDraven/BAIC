from bridge.factory import make_bridge

Bridge = make_bridge(
    "google_one_ai",
    {
        "balance_summary": "$19.99/MO · 1,000 Consumer Credits",
        "detail": "Target: Native Flow / Antigravity",
        "cta": "CLAIM $40 DEV VOUCHER",
        "operations": ["claim_dev_voucher"],
        "op_messages": {"claim_dev_voucher": "Consumer dev voucher claim queued"},
    },
)
