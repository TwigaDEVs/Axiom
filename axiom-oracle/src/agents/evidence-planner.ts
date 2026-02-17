
import { EVIDENCE_PLANNER_PROMPT } from "./prompts/evidence-planner";
import { MarketInput } from "../types";
import { callAgent } from "../../anthropic";

export interface EvidencePlan {
  marketId: string;
  search_queries: string[];
  priority_source_types: string[];
  time_window: {
    from: string;
    to: string;
  };
  confirmation_signals: {
    yes_signals: string[];
    no_signals: string[];
  };
  primary_authority: string;
}

export async function planEvidence(
  market: MarketInput
): Promise<EvidencePlan> {
  return callAgent<EvidencePlan>(
    EVIDENCE_PLANNER_PROMPT,
    JSON.stringify(market, null, 2)
  );
}
