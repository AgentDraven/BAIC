from bridge.factory import make_bridge

Bridge = make_bridge(
    "amazon_aws",
    {
        "balance_summary": "$0.00 (Unclaimed Portfolio)",
        "detail": "Targets: Bedrock (Claude 3.5 / Llama 3) · Missing API Access Keys",
        "cta": "SUBMIT ACTIVATION REQUEST",
        "operations": ["enter_provider_console", "submit_activation"],
        "op_messages": {"submit_activation": "AWS Activate request submitted"},
    },
)
