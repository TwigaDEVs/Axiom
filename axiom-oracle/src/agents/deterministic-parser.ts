
import { DETERMINISTIC_PARSER_PROMPT } from "./prompts/deterministic-parser";
import { MarketInput, ParserResult } from "../types";
import { callAgent } from "../../anthropic";

export async function parseDeterministic(
  market: MarketInput
): Promise<ParserResult> {
  return callAgent<ParserResult>(
    DETERMINISTIC_PARSER_PROMPT,
    JSON.stringify(market, null, 2)
  );
}
