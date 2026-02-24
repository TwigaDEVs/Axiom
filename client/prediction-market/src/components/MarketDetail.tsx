import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Contract } from "ethers";
import toast from "react-hot-toast";
import Badge from "./Badge";
import ConfidenceBar from "./ConfidenceBar";
import Spinner from "./Spinner";
import {
  OUTCOME_LABELS,
  OUTCOME_COLORS,
  ACTION_LABELS,
  ACTION_COLORS,
  CATEGORY_LABELS,
  formatConfidence,
  formatDeadline,
  isExpired,
} from "../utils/constants";
import type { MarketData } from "../types/market";

interface Props {
  getReadContract: () => Contract | null;
  address: string | null;
}

export default function MarketDetail({ getReadContract, address }: Props) {
  const { marketId } = useParams<{ marketId: string }>();
  const decodedId = decodeURIComponent(marketId || "");
  const navigate = useNavigate();
  const [market, setMarket] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMarket();
  }, [decodedId]);

  const loadMarket = async () => {
    setLoading(true);
    setError(null);
    try {
      const contract = getReadContract();
      if (!contract) {
        setError("No provider available. Connect your wallet.");
        return;
      }
      const data: MarketData = await contract.getMarket(decodedId);
      if (!data.question) {
        setError("Market not found");
        return;
      }
      setMarket(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load market");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-text-secondary">
        <Spinner />
        <span>Loading market…</span>
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4 opacity-30">⚠️</div>
        <h3 className="text-xl font-bold text-text-secondary mb-4">{error}</h3>
        <button
          onClick={() => navigate("/")}
          className="px-5 py-2.5 bg-bg-elevated text-text-primary border border-border rounded-xl font-semibold text-sm hover:border-accent transition-all cursor-pointer"
        >
          Back to Markets
        </button>
      </div>
    );
  }

  const resolved = market.resolved;
  const outcomeIdx = Number(market.result);
  const expired = isExpired(market.deadline);
  const res = market.resolution;
  const confidence = Number(res.confidence);
  const actionIdx = Number(res.action);
  const categoryIdx = Number(res.category);
  const hasResData = res.resolvedAt !== "";

  return (
    <div className="animate-fade-in">
      <button
        onClick={() => navigate("/")}
        className="text-text-secondary hover:text-text-primary text-sm mb-4 cursor-pointer transition-colors"
      >
        ← Back to Markets
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-start">
        {/* ──── Left Column ──── */}
        <div className="space-y-5">
          {/* Main Info */}
          <div className="bg-bg-card border border-border rounded-2xl p-6">
            <h1 className="text-2xl font-extrabold tracking-tight leading-snug mb-4">
              {market.question}
            </h1>

            <div className="flex flex-wrap gap-2 mb-6">
              {resolved ? (
                <span
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-[13px] font-semibold"
                  style={{
                    background: `${OUTCOME_COLORS[outcomeIdx]}18`,
                    color: OUTCOME_COLORS[outcomeIdx],
                  }}
                >
                  ● {OUTCOME_LABELS[outcomeIdx]}
                </span>
              ) : expired ? (
                <Badge variant="yellow" className="!px-3.5 !py-1.5 !text-[13px]">
                  ⏰ Expired — Awaiting Resolution
                </Badge>
              ) : (
                <Badge variant="blue" className="!px-3.5 !py-1.5 !text-[13px]">
                  ● Active
                </Badge>
              )}
            </div>

            {/* Details */}
            <div className="mb-6">
              <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-3">
                Market Details
              </h4>
              <DetailRow label="Market ID">
                <span className="font-mono text-[13px]">{decodedId}</span>
              </DetailRow>
              <DetailRow label="Deadline">
                {formatDeadline(market.deadline)}
              </DetailRow>
              {market.metadataURI && (
                <DetailRow label="Metadata URI">
                  <span className="font-mono text-[12px] break-all">{market.metadataURI}</span>
                </DetailRow>
              )}
            </div>

            {/* Criteria */}
            <div>
              <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-3">
                Resolution Criteria
              </h4>
              <div className="bg-bg border border-border rounded-xl p-4 text-sm text-text-secondary leading-relaxed max-h-48 overflow-y-auto">
                {market.resolutionCriteria}
              </div>
            </div>
          </div>

          {/* Oracle Resolution Data */}
          {hasResData && (
            <div className="bg-bg-card border border-border rounded-2xl p-6">
              <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-5">
                Oracle Resolution Data
              </h4>

              <div className="mb-5">
                <DetailRow label="Category">
                  {CATEGORY_LABELS[categoryIdx] || `Unknown (${categoryIdx})`}
                </DetailRow>
                <DetailRow label="Settlement Action">
                  <span
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold"
                    style={{
                      background: `${ACTION_COLORS[actionIdx]}18`,
                      color: ACTION_COLORS[actionIdx],
                    }}
                  >
                    {ACTION_LABELS[actionIdx]}
                  </span>
                </DetailRow>
                <DetailRow label="Sources Consulted">
                  <span className="font-mono">{Number(res.sourcesConsulted)}</span>
                </DetailRow>
                <DetailRow label="Resolved At">
                  <span className="font-mono text-[12px]">{res.resolvedAt}</span>
                </DetailRow>
              </div>

              {/* Confidence */}
              <div className="mb-5">
                <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-3">
                  Confidence
                </h4>
                <ConfidenceBar confidence={confidence} />
              </div>

              {/* Reasoning */}
              {res.reasoning && (
                <div className="mb-5">
                  <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-3">
                    Reasoning
                  </h4>
                  <div className="bg-bg border border-border rounded-xl p-4 text-sm text-text-secondary leading-relaxed max-h-48 overflow-y-auto">
                    {res.reasoning}
                  </div>
                </div>
              )}

              {/* Eval Summary */}
              {res.evaluationSummary && (
                <div>
                  <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-3">
                    Evaluation Summary
                  </h4>
                  <div className="bg-bg border border-border rounded-xl p-4 text-sm text-text-secondary leading-relaxed max-h-48 overflow-y-auto">
                    {res.evaluationSummary}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ──── Right Column ──── */}
        <div className="space-y-4">
          {/* Outcome Box */}
          <div
            className={`rounded-2xl p-6 border ${
              resolved
                ? "bg-success/5 border-success/20"
                : "bg-warning/5 border-warning/20"
            }`}
          >
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2 opacity-60">
              {resolved ? "Outcome" : "Status"}
            </p>
            <p
              className="text-3xl font-extrabold tracking-tight"
              style={{ color: resolved ? OUTCOME_COLORS[outcomeIdx] : "#f59e0b" }}
            >
              {resolved ? OUTCOME_LABELS[outcomeIdx] : expired ? "Pending" : "Active"}
            </p>
            {resolved && confidence > 0 && (
              <p className="text-sm mt-2 opacity-70">
                {formatConfidence(confidence)} confidence · {ACTION_LABELS[actionIdx]}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="bg-bg-card border border-border rounded-2xl p-5">
            <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-3">
              Actions
            </h4>
            <button
              onClick={loadMarket}
              className="w-full py-2.5 bg-bg-elevated text-text-primary border border-border rounded-xl font-semibold text-sm hover:border-accent hover:bg-accent-glow transition-all cursor-pointer mb-2"
            >
              ↻ Refresh
            </button>
            {!resolved && (
              <button
                onClick={() =>
                  toast.success(
                    "Resolution request sent. The oracle will process this market.",
                    { duration: 4000 }
                  )
                }
                className="w-full py-2.5 bg-accent text-white rounded-xl font-semibold text-sm hover:bg-accent-hover hover:shadow-[0_4px_16px_rgba(99,102,241,0.3)] transition-all cursor-pointer"
              >
                ⚡ Request Resolution
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Helper ─── */
function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-start py-2.5 border-b border-border/40 last:border-b-0">
      <span className="text-sm text-text-secondary shrink-0">{label}</span>
      <span className="text-sm font-medium text-right max-w-[60%] break-words">
        {children}
      </span>
    </div>
  );
}
