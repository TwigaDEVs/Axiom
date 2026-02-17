import { Router, Request, Response } from "express";
import { resolveMarket } from "../services/pipeline";
import { ResolveRequest, ResolveResponse, HealthResponse, MarketInput } from "../types";

const router = Router();

/**
 * Health check
 */
router.get("/health", (_req: Request, res: Response<HealthResponse>) => {
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
router.post("/resolve", async (req: Request, res: Response<ResolveResponse>) => {
  try {
    const { market } = req.body as ResolveRequest;

    if (!market || !market.marketId || !market.question) {
      res.status(400).json({
        success: false,
        error: "Invalid request: market object with marketId and question required",
      });
      return;
    }

    console.log(`\n[RESOLVE] Processing market: ${market.marketId}`);
    console.log(`  Question: ${market.question}`);

    const result = await resolveMarket(market);

    console.log(`  Category: ${result.category}`);
    console.log(`  Outcome: ${result.outcome} (${(result.confidence * 100).toFixed(0)}%)`);
    console.log(`  Action: ${result.settlement_action}`);

    res.json({ success: true, result });
  } catch (error) {
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
router.post("/resolve/batch", async (req: Request, res: Response) => {
  try {
    const { markets } = req.body as { markets: MarketInput[] };

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
        const result = await resolveMarket(market);
        results.push({ success: true, result });
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : "Resolution failed",
          marketId: market.marketId,
        });
      }
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error("[BATCH] Error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

export default router;
