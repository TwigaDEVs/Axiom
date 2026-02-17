
import { EVIDENCE_EVALUATOR_PROMPT } from "./prompts/evidence-evaluator";
import { MarketInput, EvidenceCorpus, EvidenceEvaluation } from "../types";
import { callAgent } from "../../anthropic";

export async function evaluateEvidence(
  market: MarketInput,
  corpus: EvidenceCorpus
): Promise<EvidenceEvaluation> {
  const userContent = JSON.stringify(
    {
      market: {
        marketId: market.marketId,
        question: market.question,
        resolution_criteria: market.resolution_criteria,
        deadline: market.deadline,
      },
      evidence: corpus,
    },
    null,
    2
  );

  return callAgent<EvidenceEvaluation>(EVIDENCE_EVALUATOR_PROMPT, userContent);
}
