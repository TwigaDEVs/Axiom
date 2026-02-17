// ═══════════════════════════════════════════════════════════
// Market Input
// ═══════════════════════════════════════════════════════════

export interface MarketInput {
  marketId: string;
  question: string;
  resolution_criteria: string;
  deadline: string;
  metadata: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════
// Classification (Agent 0)
// ═══════════════════════════════════════════════════════════

export type MarketCategory =
  | "CATEGORY_A"
  | "CATEGORY_B"
  | "CATEGORY_C"
  | "MALFORMED";

export interface ClassificationResult {
  marketId: string;
  classification: MarketCategory;
  confidence: number;
  reasoning: string;
  resolution_approach?: string;
  data_source_hint?: string;
  fallback_category?: MarketCategory | null;
  fallback_reason?: string | null;
  flags: string[];
  requires_clarification: boolean;
  clarification_needed?: string | null;
}

// ═══════════════════════════════════════════════════════════
// Deterministic Parsing (Agent 1 — Category A)
// ═══════════════════════════════════════════════════════════

export type StrategyType =
  | "CRYPTO_PRICE_TWAP"
  | "CRYPTO_PRICE_SPOT"
  | "STOCK_CLOSE_PRICE"
  | "ONCHAIN_QUERY"
  | "SPORTS_RESULT"
  | "WEATHER_API"
  | "ECONOMIC_DATA";

export interface DeterministicParseResult {
  marketId: string;
  top_category: "DETERMINISTIC";
  strategy_type: StrategyType;
  parsed_spec: Record<string, unknown>;
  resolution_ready: boolean;
}

export interface ParseRejection {
  marketId: string;
  classification: "REJECTED";
  reason: string;
  resolution_ready: false;
}

export type ParserResult = DeterministicParseResult | ParseRejection;

// ═══════════════════════════════════════════════════════════
// Evidence (Category B)
// ═══════════════════════════════════════════════════════════

export interface EvidenceSource {
  title: string;
  url: string;
  snippet: string;
  source_type: "wire_service" | "official" | "mainstream_news" | "trade_press" | "blog" | "social" | "unknown";
  published_date?: string;
  credibility_score?: number;
}

export interface EvidenceCorpus {
  query_used: string[];
  sources: EvidenceSource[];
  gathered_at: string;
}

export interface EvidenceEvaluation {
  outcome: "YES" | "NO" | "UNDETERMINED";
  confidence: number;
  reasoning: string;
  supporting_sources: string[];
  contradicting_sources: string[];
  flags: string[];
  temporal_notes?: string;
}

// ═══════════════════════════════════════════════════════════
// Resolution Result (returned to CRE)
// ═══════════════════════════════════════════════════════════

export type SettlementAction = "SETTLE" | "DEFER" | "ESCALATE" | "REJECT";

export interface ResolutionResult {
  marketId: string;
  category: MarketCategory;
  outcome: "YES" | "NO" | "UNDETERMINED";
  confidence: number;
  settlement_action: SettlementAction;
  reasoning: string;
  evidence_trail: {
    sources_consulted: number;
    sources: EvidenceSource[];
    evaluation_summary: string;
  };
  deterministic_spec?: Record<string, unknown>;
  resolved_at: string;
}

// ═══════════════════════════════════════════════════════════
// API Request / Response
// ═══════════════════════════════════════════════════════════

export interface ResolveRequest {
  market: MarketInput;
}

export interface ResolveResponse {
  success: boolean;
  result?: ResolutionResult;
  error?: string;
}

export interface HealthResponse {
  status: string;
  version: string;
  uptime: number;
}
