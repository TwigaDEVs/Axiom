import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 1024;

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

/**
 * Strip markdown fences and parse JSON from LLM output.
 */
function parseJSON<T>(raw: string): T {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    const nl = cleaned.indexOf("\n");
    cleaned = nl !== -1 ? cleaned.slice(nl + 1) : cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  return JSON.parse(cleaned.trim()) as T;
}

/**
 * Make a structured call to Claude with a system prompt and user content.
 * Returns parsed JSON of type T.
 */
export async function callAgent<T>(
  systemPrompt: string,
  userContent: string,
  temperature: number = 0
): Promise<T> {
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: [{ role: "user", content: userContent }],
    temperature,
  });

  const raw =
    response.content[0].type === "text" ? response.content[0].text : "";

  if (!raw) {
    throw new Error("Empty response from Anthropic");
  }

  return parseJSON<T>(raw);
}

/**
 * Make a freeform call to Claude. Returns raw text.
 */
export async function callAgentRaw(
  systemPrompt: string,
  userContent: string,
  temperature: number = 0
): Promise<string> {
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: [{ role: "user", content: userContent }],
    temperature,
  });

  return response.content[0].type === "text" ? response.content[0].text : "";
}
