"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveMarket = resolveMarket;
const classifier_1 = require("../agents/classifier");
const deterministic_parser_1 = require("../agents/deterministic-parser");
const evidence_evaluator_1 = require("../agents/evidence-evaluator");
const evidence_gatherer_1 = require("../agents/evidence-gatherer");
const evidence_planner_1 = require("../agents/evidence-planner");
const resolver_class_a_1 = require("../resolver/resolver_class_a");
/**
 * Determine settlement action based on confidence thresholds.
 */
function determineSettlement(confidence) {
    if (confidence >= 0.85)
        return "SETTLE";
    if (confidence >= 0.70)
        return "DEFER";
    return "ESCALATE";
}
/**
 * Resolve a Category A (deterministic) market.
 *
 * For the PoC, this parses the spec but doesn't hit live data endpoints.
 * The parsed_spec contains everything needed for a resolver to execute.
 */
async function resolveCategoryA(market) {
    const parsed = await (0, deterministic_parser_1.parseDeterministic)(market);
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
    const det = parsed;
    // Resolve against live data
    const resolution = await (0, resolver_class_a_1.resolveDeterministic)(market, det.strategy_type, det.parsed_spec);
    const confidence = resolution.confidence;
    const action = determineSettlement(confidence);
    return {
        marketId: market.marketId,
        category: "CATEGORY_A",
        outcome: resolution.outcome,
        confidence,
        settlement_action: action,
        reasoning: resolution.reasoning,
        evidence_trail: {
            sources_consulted: 1,
            sources: [
                {
                    title: `${det.strategy_type} data from ${resolution.data_fetched.source}`,
                    url: resolution.data_fetched.source,
                    snippet: JSON.stringify(resolution.data_fetched.data).slice(0, 300),
                    source_type: "official",
                    published_date: resolution.data_fetched.fetched_at,
                },
            ],
            evaluation_summary: `Strategy: ${det.strategy_type}. ` +
                `Data source: ${resolution.data_fetched.source}. ` +
                `Fetch success: ${resolution.data_fetched.success}. ` +
                (resolution.agent_evaluation.data_summary?.comparison_result || ""),
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
async function resolveCategoryB(market) {
    // Step 1: Plan evidence gathering
    const plan = await (0, evidence_planner_1.planEvidence)(market);
    // Step 2: Gather evidence (cheap HTTP calls, no LLM)
    const corpus = await (0, evidence_gatherer_1.gatherEvidence)(plan);
    // Step 3: Evaluate evidence (LLM call)
    const evaluation = await (0, evidence_evaluator_1.evaluateEvidence)(market, corpus);
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
function resolveRejected(market, category, reasoning) {
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
async function resolveMarket(market) {
    // Step 1: Classify
    const classification = await (0, classifier_1.classifyMarket)(market);
    // Step 2: Route by category
    switch (classification.classification) {
        case "CATEGORY_A":
            return resolveCategoryA(market);
        case "CATEGORY_B":
            return resolveCategoryB(market);
        case "CATEGORY_C":
            return resolveRejected(market, "CATEGORY_C", `Subjective/ambiguous market: ${classification.reasoning}`);
        case "MALFORMED":
            return resolveRejected(market, "MALFORMED", `Malformed market: ${classification.reasoning}`);
        default:
            return resolveRejected(market, "MALFORMED", `Unknown classification: ${classification.classification}`);
    }
}
//# sourceMappingURL=pipeline.js.map