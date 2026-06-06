import { Badge } from "./Badge";
import type { ProviderCard } from "../api";

type Props = {
  card: ProviderCard;
  onOpen: (id: string) => void;
  onAction: (id: string, op: string) => void;
};

export function ProviderCardView({ card, onOpen, onAction }: Props) {
  const isInfra = card.kind === "hyperscaler";
  const primaryOp = card.operations[0];

  return (
    <div className="panel flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-cyan-200">{card.title}</h3>
        <Badge status={card.status_badge} />
      </div>
      {card.balance_summary && <p className="text-xs text-gray-300">{card.balance_summary}</p>}
      {card.detail && <p className="text-xs text-gray-500">{card.detail}</p>}
      <div className="mt-auto flex flex-wrap gap-2 pt-2">
        {isInfra && (
          <button type="button" className="btn-primary" onClick={() => onOpen(card.provider_id)}>
            Enter console
          </button>
        )}
        {primaryOp && !isInfra && (
          <button type="button" className="btn-primary" onClick={() => onAction(card.provider_id, primaryOp)}>
            {card.cta ?? primaryOp}
          </button>
        )}
      </div>
    </div>
  );
}
