"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateEvidence = evaluateEvidence;
const evidence_evaluator_1 = require("./prompts/evidence-evaluator");
const anthropic_1 = require("../anthropic");
async function evaluateEvidence(market, corpus) {
    const userContent = JSON.stringify({
        market: {
            marketId: market.marketId,
            question: market.question,
            resolution_criteria: market.resolution_criteria,
            deadline: market.deadline,
        },
        evidence: corpus,
    }, null, 2);
    return (0, anthropic_1.callAgent)(evidence_evaluator_1.EVIDENCE_EVALUATOR_PROMPT, userContent);
}
//# sourceMappingURL=evidence-evaluator.js.map