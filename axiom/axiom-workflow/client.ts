import {
  cre,
  ok,
  consensusIdenticalAggregation,
  type Runtime,
  type HTTPSendRequester,
} from "@chainlink/cre-sdk";
import { Config } from "./types";
import { MARKET_CLASSIFIER_PROMPT } from "./agents/classifier";
import { DETERMINISTIC_PARSER_PROMPT } from "./agents/deterministic";
import { MarketInput, ClassificationResult, ParserResult, PipelineResult } from "./types";

const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 1024;
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

interface AnthropicResponse {
  statusCode: number;
  text: string;
  rawJsonString: string;
}

function parseJSON<T>(raw: string): T {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    const nl = cleaned.indexOf("\n");
    cleaned = nl !== -1 ? cleaned.slice(nl + 1) : cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  return JSON.parse(cleaned.trim()) as T;
}

const PostAnthropicData =
  (systemPrompt: string, userContent: string, apiKey: string) =>
  (sendRequester: HTTPSendRequester, config: Config): AnthropicResponse => {
    const payload = {
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: 0,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    };

    const bodyBytes = new TextEncoder().encode(JSON.stringify(payload));
    const body = Buffer.from(bodyBytes).toString("base64");

    const req = {
      url: ANTHROPIC_URL,
      method: "POST" as const,
      body,
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      }
    };

    const resp = sendRequester.sendRequest(req).result();
    const bodyText = new TextDecoder().decode(resp.body);

    if (!ok(resp)) {
      throw new Error(`Anthropic request failed: ${resp.statusCode}. ${bodyText}`);
    }

    const parsed = JSON.parse(bodyText);
    const text =
      parsed?.content?.[0]?.type === "text" ? parsed.content[0].text : "";

    if (!text) throw new Error("Malformed Anthropic response: missing content[0].text");

    return { statusCode: resp.statusCode, text, rawJsonString: bodyText };
  };

export class OracleClient {
  private runtime: Runtime<Config>;
  private apiKey: string;

  constructor(runtime: Runtime<Config>) {
    this.runtime = runtime;
    this.apiKey = "";
  }

  private callAnthropic(systemPrompt: string, userContent: string): AnthropicResponse {
    const httpClient = new cre.capabilities.HTTPClient();

    return httpClient
      .sendRequest(
        this.runtime,
        PostAnthropicData(systemPrompt, userContent, this.apiKey),
        consensusIdenticalAggregation<AnthropicResponse>()
      )(this.runtime.config)
      .result();
  }

  classify(market: MarketInput): ClassificationResult {
    const result = this.callAnthropic(
      MARKET_CLASSIFIER_PROMPT,
      JSON.stringify(market, null, 2)
    );
    return parseJSON<ClassificationResult>(result.text);
  }

  parseDeterministic(market: MarketInput): ParserResult {
    const result = this.callAnthropic(
      DETERMINISTIC_PARSER_PROMPT,
      JSON.stringify(market, null, 2)
    );
    return parseJSON<ParserResult>(result.text);
  }
}

