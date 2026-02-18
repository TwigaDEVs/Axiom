import { RESOLUTION_AGENT_PROMPT } from "./prompts/resolution-agent";
import { MarketInput } from "../types";
import { callAgent } from "../../anthropic";

export interface ResolutionAgentInput {
  market: MarketInput;
  parsed_spec: Record<string, unknown>;
  fetched_data: Record<string, unknown>;
  data_source: string;
  fetch_timestamp: string;
}

export interface ResolutionAgentOutput {
  outcome: "YES" | "NO" | "UNDETERMINED";
  confidence: number;
  reasoning: string;
  data_summary: {
    fetched_value: string;
    threshold: string;
    comparator: string;
    comparison_result: string;
  };
  flags: string[];
}

export async function resolveWithData(
  input: ResolutionAgentInput
): Promise<ResolutionAgentOutput> {
  return callAgent<ResolutionAgentOutput>(
    RESOLUTION_AGENT_PROMPT,
    JSON.stringify(input, null, 2)
  );
}
