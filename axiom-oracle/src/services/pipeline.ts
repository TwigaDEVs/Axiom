import { classifyMarket } from "../agents/classifier";
import { parseDeterministic } from "../agents/deterministic-parser";
import { evaluateEvidence } from "../agents/evidence-evaluator";
import { gatherEvidence } from "../agents/evidence-gatherer";
import { planEvidence } from "../agents/evidence-planner";
import {
  MarketInput,
  ResolutionResult,
  SettlementAction,
} from "../types";

/**
 * Determine settlement action based on confidence thresholds.
 */
function determineSettlement(confidence: number): SettlementAction {
  if (confidence >= 0.85) return "SETTLE";
  if (confidence >= 0.70) return "DEFER";
  return "ESCALATE";
}

/**
 * Resolve a Category A (deterministic) market.
 *
 * For the PoC, this parses the spec but doesn't hit live data endpoints.
 * The parsed_spec contains everything needed for a resolver to execute.
 */
async function resolveCategoryA(market: MarketInput): Promise<ResolutionResult> {
  const parsed = await parseDeterministic(market);

  if ("classification" in parsed && parsed.classification === "REJECTED") {
    return {
      marketId: market.marketId,
      category: "CATEGORY_A",
      outcome: "UNDETERMINED",
      confidence: 0,
      settlement_action: "ESCALATE",
      reasoning: `Deterministic parser rejected: ${parsed.reason}`,
      evidence_trail: {
        sources_consulted: 0,
        sources: [],
        evaluation_summary: "Market could not be parsed into deterministic spec.",
      },
      resolved_at: new Date().toISOString(),
    };
  }

  // Successfully parsed — return spec for downstream resolver
  const det = parsed as import("../types").DeterministicParseResult;

  return {
    marketId: market.marketId,
    category: "CATEGORY_A",
    outcome: "UNDETERMINED", // Actual resolution requires hitting data endpoints
    confidence: 1.0, // Confidence in the SPEC, not the outcome
    settlement_action: "DEFER", // Deferred until data endpoint is queried
    reasoning: `Market parsed as ${det.strategy_type}. Ready for automated resolution via data endpoint.`,
    evidence_trail: {
      sources_consulted: 0,
      sources: [],
      evaluation_summary: `Deterministic spec extracted. Strategy: ${det.strategy_type}.`,
    },
    deterministic_spec: {
      strategy_type: det.strategy_type,
      ...det.parsed_spec,
    },
    resolved_at: new Date().toISOString(),
  };
}

/**
 * Resolve a Category B (event-based) market.
 *
 * Full pipeline:
 *   1. Evidence Planner — decides what to search for
 *   2. Evidence Gatherer — fetches from news APIs (no LLM cost)
 *   3. Evidence Evaluator — AI evaluates the corpus and produces verdict
 */
async function resolveCategoryB(market: MarketInput): Promise<ResolutionResult> {
  // Step 1: Plan evidence gathering
  const plan = await planEvidence(market);

  // Step 2: Gather evidence (cheap HTTP calls, no LLM)
  const corpus = await gatherEvidence(plan);

  // Step 3: Evaluate evidence (LLM call)
  const evaluation = await evaluateEvidence(market, corpus);

  const confidence = evaluation.confidence;
  const action = determineSettlement(confidence);

  return {
    marketId: market.marketId,
    category: "CATEGORY_B",
    outcome: evaluation.outcome,
    confidence,
    settlement_action: action,
    reasoning: evaluation.reasoning,
    evidence_trail: {
      sources_consulted: corpus.sources.length,
      sources: corpus.sources,
      evaluation_summary: `${corpus.sources.length} sources evaluated. ` +
        `${evaluation.supporting_sources.length} supporting, ` +
        `${evaluation.contradicting_sources.length} contradicting. ` +
        (evaluation.temporal_notes || ""),
    },
    resolved_at: new Date().toISOString(),
  };
}

/**
 * Resolve a Category C (subjective) or MALFORMED market.
 */
function resolveRejected(
  market: MarketInput,
  category: "CATEGORY_C" | "MALFORMED",
  reasoning: string
): ResolutionResult {
  return {
    marketId: market.marketId,
    category,
    outcome: "UNDETERMINED",
    confidence: 0,
    settlement_action: "REJECT",
    reasoning,
    evidence_trail: {
      sources_consulted: 0,
      sources: [],
      evaluation_summary: "Market rejected — not suitable for automated resolution.",
    },
    resolved_at: new Date().toISOString(),
  };
}

/**
 * Main resolution pipeline.
 * Takes a market, classifies it, and routes to the appropriate resolver.
 */
export async function resolveMarket(market: MarketInput): Promise<ResolutionResult> {
  // Step 1: Classify
  const classification = await classifyMarket(market);

  // Step 2: Route by category
  switch (classification.classification) {
    case "CATEGORY_A":
      return resolveCategoryA(market);

    case "CATEGORY_B":
      return resolveCategoryB(market);

    case "CATEGORY_C":
      return resolveRejected(
        market,
        "CATEGORY_C",
        `Subjective/ambiguous market: ${classification.reasoning}`
      );

    case "MALFORMED":
      return resolveRejected(
        market,
        "MALFORMED",
        `Malformed market: ${classification.reasoning}`
      );

    default:
      return resolveRejected(
        market,
        "MALFORMED",
        `Unknown classification: ${classification.classification}`
      );
  }
}
