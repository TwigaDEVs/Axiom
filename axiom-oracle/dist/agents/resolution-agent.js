"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveWithData = resolveWithData;
const resolution_agent_1 = require("./prompts/resolution-agent");
const anthropic_1 = require("../anthropic");
async function resolveWithData(input) {
    return (0, anthropic_1.callAgent)(resolution_agent_1.RESOLUTION_AGENT_PROMPT, JSON.stringify(input, null, 2));
}
//# sourceMappingURL=resolution-agent.js.map