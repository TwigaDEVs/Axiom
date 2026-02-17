import { PipelineResult, ClassificationResult } from "./types";

const ICONS: Record<string, string> = {
  CATEGORY_A: "🟢",
  CATEGORY_B: "🟡",
  CATEGORY_C: "🔴",
  MALFORMED: "⚫",
  ERROR: "❌",
};

export function printResult(result: PipelineResult): void {
  const { market, classification, parsing } = result;

  console.log(`\n${"═".repeat(70)}`);
  console.log(`  Market: ${market.marketId}`);
  console.log(`  Question: ${market.question}`);
  console.log(`${"═".repeat(70)}`);

  const icon = ICONS[classification.classification] || "❓";
  console.log(`  ${icon} Classification: ${classification.classification}`);

  const conf =
    classification.confidence <= 1.0
      ? classification.confidence * 100
      : classification.confidence;
  console.log(`  📊 Confidence: ${conf.toFixed(0)}%`);
  console.log(`  💬 Reasoning: ${classification.reasoning}`);

  if (classification.resolution_approach) {
    console.log(`  🔧 Approach: ${classification.resolution_approach}`);
  }

  if (classification.data_source_hint) {
    console.log(`  📡 Data Source: ${classification.data_source_hint}`);
  }

  if (classification.fallback_category) {
    console.log(
      `  🔄 Fallback: ${classification.fallback_category} — ${classification.fallback_reason || ""}`
    );
  }

  if (classification.flags?.length) {
    console.log(`  🚩 Flags: ${classification.flags.join(", ")}`);
  }

  if (classification.requires_clarification) {
    console.log(
      `  ❓ Needs Clarification: ${classification.clarification_needed || ""}`
    );
  }

  // If Category A, show parsing result
  if (parsing) {
    console.log(`  ${"─".repeat(50)}`);
    if ("strategy_type" in parsing) {
      console.log(`  ⚙️  Strategy: ${parsing.strategy_type}`);
      console.log(
        `  📋 Parsed Spec: ${JSON.stringify(parsing.parsed_spec, null, 4).split("\n").join("\n    ")}`
      );
      console.log(`  ✅ Resolution Ready: ${parsing.resolution_ready}`);
    } else {
      console.log(`  ⛔ Parser Rejected: ${parsing.reason}`);
    }
  }
}

export function printSummary(results: PipelineResult[]): void {
  const summary: Record<string, number> = {
    CATEGORY_A: 0,
    CATEGORY_B: 0,
    CATEGORY_C: 0,
    MALFORMED: 0,
  };

  for (const r of results) {
    const cat = r.classification.classification;
    summary[cat] = (summary[cat] || 0) + 1;
  }

  console.log(`\n${"═".repeat(70)}`);
  console.log("  CLASSIFICATION SUMMARY");
  console.log(`${"═".repeat(70)}`);
  console.log(`  🟢 Category A (Deterministic):  ${summary.CATEGORY_A || 0}`);
  console.log(`  🟡 Category B (Event-Based):    ${summary.CATEGORY_B || 0}`);
  console.log(`  🔴 Category C (Subjective):     ${summary.CATEGORY_C || 0}`);
  console.log(`  ⚫ Malformed:                    ${summary.MALFORMED || 0}`);

  // Show Category A parsing stats
  const catAResults = results.filter(
    (r) => r.classification.classification === "CATEGORY_A"
  );
  if (catAResults.length > 0) {
    const parsed = catAResults.filter(
      (r) => r.parsing && "strategy_type" in r.parsing
    ).length;
    const rejected = catAResults.filter(
      (r) => r.parsing && "classification" in r.parsing
    ).length;
    console.log(`\n  Category A Parsing:`);
    console.log(`    ✅ Successfully parsed: ${parsed}`);
    console.log(`    ⛔ Rejected by parser:  ${rejected}`);
  }

  console.log(`${"═".repeat(70)}\n`);
}