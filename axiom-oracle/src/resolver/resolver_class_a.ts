import { MarketInput, StrategyType } from "../types";
import { DataFetcher, FetchResult } from "./base";
import { CryptoPriceFetcher } from "./crypto-price";
import { SportsResultFetcher } from "./sports-result";
import { WeatherFetcher } from "./weather";
import { StockPriceFetcher } from "./stock-price";
import { OnchainQueryFetcher } from "./onchain-query";
import {
  resolveWithData,
  ResolutionAgentOutput,
} from "../agents/resolution-agent";

// Singleton fetcher instances
const fetchers: Record<string, DataFetcher> = {
  CRYPTO_PRICE_TWAP: new CryptoPriceFetcher(),
  CRYPTO_PRICE_SPOT: new CryptoPriceFetcher(),
  STOCK_CLOSE_PRICE: new StockPriceFetcher(),
  SPORTS_RESULT: new SportsResultFetcher(),
  WEATHER_API: new WeatherFetcher(),
  ONCHAIN_QUERY: new OnchainQueryFetcher(),
};

export interface DeterministicResolution {
  outcome: "YES" | "NO" | "UNDETERMINED";
  confidence: number;
  reasoning: string;
  data_fetched: FetchResult;
  agent_evaluation: ResolutionAgentOutput;
}

/**
 * Resolve a Category A market end-to-end:
 *   1. Pick the right data fetcher based on strategy_type
 *   2. Fetch raw data from the API
 *   3. Pass data + market + spec to the resolution agent
 *   4. Return the agent's verdict
 */
export async function resolveDeterministic(
  market: MarketInput,
  strategyType: StrategyType,
  parsedSpec: Record<string, unknown>
): Promise<DeterministicResolution> {
  const fetcher = fetchers[strategyType];

  if (!fetcher) {
    return {
      outcome: "UNDETERMINED",
      confidence: 0,
      reasoning: `No resolver available for strategy type: ${strategyType}`,
      data_fetched: {
        success: false,
        data: {},
        source: "none",
        fetched_at: new Date().toISOString(),
        error: `Unsupported strategy: ${strategyType}`,
      },
      agent_evaluation: {
        outcome: "UNDETERMINED",
        confidence: 0,
        reasoning: `No resolver for ${strategyType}`,
        data_summary: {
          fetched_value: "N/A",
          threshold: "N/A",
          comparator: "N/A",
          comparison_result: "N/A",
        },
        flags: ["UNSUPPORTED_STRATEGY"],
      },
    };
  }

  // Step 1: Fetch raw data
  const fetchResult = await fetcher.fetch(parsedSpec);

  // If fetch failed, still pass to agent — it will return UNDETERMINED with reasoning
  // Step 2: Pass to resolution agent
  const agentResult = await resolveWithData({
    market,
    parsed_spec: parsedSpec,
    fetched_data: fetchResult.data,
    data_source: fetchResult.source,
    fetch_timestamp: fetchResult.fetched_at,
  });

  return {
    outcome: agentResult.outcome,
    confidence: agentResult.confidence,
    reasoning: agentResult.reasoning,
    data_fetched: fetchResult,
    agent_evaluation: agentResult,
  };
}
