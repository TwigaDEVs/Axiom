// ═══════════════════════════════════════════════════════════
// Market Input Types
// ═══════════════════════════════════════════════════════════

export interface MarketInput {
  marketId: string;
  question: string;
  resolution_criteria: string;
  deadline: string;
  metadata: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════
// Agent 0: Classifier Output Types
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
// Agent 1: Deterministic Parser Output Types
// ═══════════════════════════════════════════════════════════

export type StrategyType =
  | "CRYPTO_PRICE_TWAP"
  | "CRYPTO_PRICE_SPOT"
  | "STOCK_CLOSE_PRICE"
  | "ONCHAIN_QUERY"
  | "SPORTS_RESULT"
  | "WEATHER_API"
  | "ECONOMIC_DATA";

export interface CryptoPriceSpec {
  asset: string;
  pair: string;
  comparator: ">" | "<" | "=" | ">=" | "<=";
  threshold: number;
  resolution_time: string;
  aggregation_method: "TWAP" | "SPOT";
  window?: string;
  sources?: string[];
}

export interface StockPriceSpec {
  ticker: string;
  comparator: ">" | "<" | "=" | ">=" | "<=";
  threshold: number;
  exchange?: string | null;
  resolution_date: string;
}

export interface OnchainQuerySpec {
  chain: string;
  contract_address?: string | null;
  metric: string;
  comparator: ">" | "<" | "=" | ">=" | "<=";
  threshold: number | string;
  resolution_time: string;
}

export interface SportsResultSpec {
  sport: string;
  team_a: string;
  team_b: string;
  competition: string;
  event_date: string;
  outcome_type: "win" | "loss" | "draw" | "score_over" | "score_under";
  target_team: string;
}

export interface WeatherSpec {
  location: string;
  station_id?: string | null;
  metric: string;
  unit: string;
  comparator: ">" | "<" | "=" | ">=" | "<=";
  threshold: number;
  measurement_type: "max" | "min" | "average" | "any_point";
  date: string;
  source?: string | null;
}

export interface EconomicDataSpec {
  indicator: string;
  source_agency: string;
  comparator: ">" | "<" | "=" | ">=" | "<=";
  threshold: number;
  release_date?: string | null;
  resolution_date: string;
}

export type ParsedSpec =
  | CryptoPriceSpec
  | StockPriceSpec
  | OnchainQuerySpec
  | SportsResultSpec
  | WeatherSpec
  | EconomicDataSpec;

export interface DeterministicParseResult {
  marketId: string;
  top_category: "DETERMINISTIC";
  strategy_type: StrategyType;
  parsed_spec: ParsedSpec;
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
// Pipeline Types
// ═══════════════════════════════════════════════════════════

export interface PipelineResult {
  market: MarketInput;
  classification: ClassificationResult;
  parsing?: ParserResult;
}

export type Config = {
  schedule: string;
};