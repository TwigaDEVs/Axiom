import {
  MarketInput,
  ClassificationResult,
  ParserResult,
  PipelineResult,
  Config,
} from "./types";
import { OracleClient } from "./client";
import { Runtime } from "@chainlink/cre-sdk";

export class ClassificationPipeline {
  private client: OracleClient;

  constructor(runtime: Runtime<Config>) {
    this.client = new OracleClient(runtime);
  }

  processMarket(market: MarketInput): PipelineResult {
    const classification = this.client.classify(market);
    const result: PipelineResult = { market, classification };

    if (classification.classification === "CATEGORY_A") {
      result.parsing = this.client.parseDeterministic(market);
    }

    return result;
  }

  processMarkets(markets: MarketInput[]): PipelineResult[] {
    const results: PipelineResult[] = [];

    for (const market of markets) {
      try {
        results.push(this.processMarket(market));
      } catch (error) {
        results.push({
          market,
          classification: {
            marketId: market.marketId,
            classification: "MALFORMED",
            confidence: 0,
            reasoning: `Pipeline error: ${error}`,
            flags: ["PIPELINE_ERROR"],
            requires_clarification: false,
          },
        });
      }
    }

    return results;
  }
}