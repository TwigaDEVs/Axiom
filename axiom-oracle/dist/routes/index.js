"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pipeline_1 = require("../services/pipeline");
const router = (0, express_1.Router)();
/**
 * Health check
 */
router.get("/health", (_req, res) => {
    res.json({
        status: "ok",
        version: "0.1.0",
        uptime: process.uptime(),
    });
});
/**
 * POST /resolve
 *
 * Main endpoint — CRE calls this with a market.
 * Returns a full resolution result with confidence score and evidence trail.
 */
router.post("/resolve", async (req, res) => {
    try {
        const { market } = req.body;
        if (!market || !market.marketId || !market.question) {
            res.status(400).json({
                success: false,
                error: "Invalid request: market object with marketId and question required",
            });
            return;
        }
        console.log(`\n[RESOLVE] Processing market: ${market.marketId}`);
        console.log(`  Question: ${market.question}`);
        const result = await (0, pipeline_1.resolveMarket)(market);
        console.log(`  Category: ${result.category}`);
        console.log(`  Outcome: ${result.outcome} (${(result.confidence * 100).toFixed(0)}%)`);
        console.log(`  Action: ${result.settlement_action}`);
        res.json({ success: true, result });
    }
    catch (error) {
        console.error("[RESOLVE] Error:", error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Internal server error",
        });
    }
});
/**
 * POST /resolve/batch
 *
 * Resolve multiple markets in sequence.
 */
router.post("/resolve/batch", async (req, res) => {
    try {
        const { markets } = req.body;
        if (!markets || !Array.isArray(markets)) {
            res.status(400).json({
                success: false,
                error: "Invalid request: markets array required",
            });
            return;
        }
        console.log(`\n[BATCH] Processing ${markets.length} markets`);
        const results = [];
        for (const market of markets) {
            try {
                const result = await (0, pipeline_1.resolveMarket)(market);
                results.push({ success: true, result });
            }
            catch (error) {
                results.push({
                    success: false,
                    error: error instanceof Error ? error.message : "Resolution failed",
                    marketId: market.marketId,
                });
            }
        }
        res.json({ success: true, results });
    }
    catch (error) {
        console.error("[BATCH] Error:", error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Internal server error",
        });
    }
});
exports.default = router;
//# sourceMappingURL=index.js.map