"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDeterministic = parseDeterministic;
const deterministic_parser_1 = require("./prompts/deterministic-parser");
const anthropic_1 = require("../anthropic");
async function parseDeterministic(market) {
    return (0, anthropic_1.callAgent)(deterministic_parser_1.DETERMINISTIC_PARSER_PROMPT, JSON.stringify(market, null, 2));
}
//# sourceMappingURL=deterministic-parser.js.map