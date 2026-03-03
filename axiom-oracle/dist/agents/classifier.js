"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyMarket = classifyMarket;
const classifier_1 = require("./prompts/classifier");
const anthropic_1 = require("../anthropic");
async function classifyMarket(market) {
    return (0, anthropic_1.callAgent)(classifier_1.MARKET_CLASSIFIER_PROMPT, JSON.stringify(market, null, 2));
}
//# sourceMappingURL=classifier.js.map