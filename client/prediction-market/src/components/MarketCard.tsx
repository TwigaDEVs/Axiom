import { useNavigate } from "react-router-dom";
import Badge from "./Badge";
import {
  OUTCOME_LABELS,
  ACTION_LABELS,
  formatDeadline,
  formatConfidence,
  isExpired,
} from "../utils/constants";
import type { MarketData } from "../types/market";

interface Props {
  marketId: string;
  market: MarketData;
}

export default function MarketCard({ marketId, market }: Props) {
  const navigate = useNavigate();
  const resolved = market.resolved;
  const outcomeIdx = Number(market.result);
  const expired = isExpired(market.deadline);
  const confidence = Number(market.resolution?.confidence || 0);
  const action = Number(market.resolution?.action || 0);

  const statusBadge = () => {
    if (resolved) {
      const v = outcomeIdx === 1 ? "green" : outcomeIdx === 2 ? "red" : "yellow";
      return <Badge variant={v as any}>{OUTCOME_LABELS[outcomeIdx]}</Badge>;
    }
    if (expired) return <Badge variant="yellow">Expired</Badge>;
    return <Badge variant="blue">Active</Badge>;
  };

  return (
    <div
      onClick={() => navigate(`/market/${encodeURIComponent(marketId)}`)}
      className="bg-bg-card border border-border rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:border-accent/30 hover:bg-bg-card-hover hover:-translate-y-0.5 hover:shadow-[0_4px_24px_rgba(0,0,0,0.3)] animate-fade-in"
    >
      <h3 className="text-[17px] font-semibold leading-snug mb-3 tracking-tight">
        {market.question}
      </h3>

      <div className="flex flex-wrap gap-2 mb-4">
        {statusBadge()}
        {resolved && confidence > 0 && (
          <Badge>{formatConfidence(confidence)} conf</Badge>
        )}
        {resolved && <Badge>{ACTION_LABELS[action]}</Badge>}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <span className="font-mono text-xs text-text-muted truncate max-w-[180px]">
          {marketId}
        </span>
        <span className="text-xs text-text-secondary">
          {expired ? "Ended" : "Ends"} {formatDeadline(market.deadline)}
        </span>
      </div>
    </div>
  );
}
