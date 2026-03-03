"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.callAgent = callAgent;
exports.callAgentRaw = callAgentRaw;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 1024;
let client = null;
function getClient() {
    if (!client) {
        client = new sdk_1.default({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
    return client;
}
/**
 * Strip markdown fences and parse JSON from LLM output.
 */
function parseJSON(raw) {
    let cleaned = raw.trim();
    if (cleaned.startsWith("```")) {
        const nl = cleaned.indexOf("\n");
        cleaned = nl !== -1 ? cleaned.slice(nl + 1) : cleaned.slice(3);
    }
    if (cleaned.endsWith("```"))
        cleaned = cleaned.slice(0, -3);
    return JSON.parse(cleaned.trim());
}
/**
 * Make a structured call to Claude with a system prompt and user content.
 * Returns parsed JSON of type T.
 */
async function callAgent(systemPrompt, userContent, temperature = 0) {
    const response = await getClient().messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages: [{ role: "user", content: userContent }],
        temperature,
    });
    const raw = response.content[0].type === "text" ? response.content[0].text : "";
    if (!raw) {
        throw new Error("Empty response from Anthropic");
    }
    return parseJSON(raw);
}
/**
 * Make a freeform call to Claude. Returns raw text.
 */
async function callAgentRaw(systemPrompt, userContent, temperature = 0) {
    const response = await getClient().messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages: [{ role: "user", content: userContent }],
        temperature,
    });
    return response.content[0].type === "text" ? response.content[0].text : "";
}
//# sourceMappingURL=anthropic.js.map