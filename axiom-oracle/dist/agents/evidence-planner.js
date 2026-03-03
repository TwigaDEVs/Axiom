"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.planEvidence = planEvidence;
const evidence_planner_1 = require("./prompts/evidence-planner");
const anthropic_1 = require("../anthropic");
async function planEvidence(market) {
    return (0, anthropic_1.callAgent)(evidence_planner_1.EVIDENCE_PLANNER_PROMPT, JSON.stringify(market, null, 2));
}
//# sourceMappingURL=evidence-planner.js.map