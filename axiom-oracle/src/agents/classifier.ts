
import { MARKET_CLASSIFIER_PROMPT } from "./prompts/classifier";
import { MarketInput, ClassificationResult } from "../types";
import { callAgent } from "../../anthropic";

export async function classifyMarket(
  market: MarketInput
): Promise<ClassificationResult> {
  return callAgent<ClassificationResult>(
    MARKET_CLASSIFIER_PROMPT,
    JSON.stringify(market, null, 2)
  );
}
