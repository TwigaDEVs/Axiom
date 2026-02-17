#!/bin/bash
# ═══════════════════════════════════════════════════
# Oracle Engine — Test Script
# ═══════════════════════════════════════════════════
# 
# Usage:
#   1. Start the server: npm run dev
#   2. In another terminal: chmod +x test.sh && ./test.sh
#
# Make sure ANTHROPIC_API_KEY is set in .env

BASE_URL="http://localhost:3000"

echo ""
echo "══════════════════════════════════════════════════"
echo "  Oracle Engine — Test Suite"
echo "══════════════════════════════════════════════════"

# ── Health Check ────────────────────────────────────
echo ""
echo "▸ Health Check"
curl -s "$BASE_URL/api/health"
echo ""

# ── Validation Test ─────────────────────────────────
echo ""
echo "▸ Validation (bad request)"
curl -s -X POST "$BASE_URL/api/resolve" \
  -H "Content-Type: application/json" \
  -d '{"market": {"foo": "bar"}}'
echo ""

# ── Category A: Crypto Price ────────────────────────
echo ""
echo "══════════════════════════════════════════════════"
echo "▸ Category A: BTC Price (TWAP)"
echo "══════════════════════════════════════════════════"
curl -s -X POST "$BASE_URL/api/resolve" \
  -H "Content-Type: application/json" \
  -d '{
    "market": {
      "marketId": "MKT-001",
      "question": "Will BTC close above $100,000 on March 1, 2026 at 00:00 UTC?",
      "resolution_criteria": "Use 1-hour TWAP BTC/USD across Binance, Coinbase, Kraken.",
      "deadline": "2026-03-01T00:00:00Z",
      "metadata": {}
    }
  }'
echo ""

# ── Category A: Sports Result ──────────────────────
echo ""
echo "══════════════════════════════════════════════════"
echo "▸ Category A: NBA Game"
echo "══════════════════════════════════════════════════"
curl -s -X POST "$BASE_URL/api/resolve" \
  -H "Content-Type: application/json" \
  -d '{
    "market": {
      "marketId": "MKT-002",
      "question": "Will the Lakers beat the Celtics on February 20, 2026?",
      "resolution_criteria": "Official NBA final score. Lakers must win.",
      "deadline": "2026-02-21T00:00:00Z",
      "metadata": {}
    }
  }'
echo ""

# ── Category B: Fed Decision ───────────────────────
echo ""
echo "══════════════════════════════════════════════════"
echo "▸ Category B: Fed Rate Cut"
echo "══════════════════════════════════════════════════"
curl -s -X POST "$BASE_URL/api/resolve" \
  -H "Content-Type: application/json" \
  -d '{
    "market": {
      "marketId": "MKT-004",
      "question": "Will the Federal Reserve cut interest rates at the March 2026 FOMC meeting?",
      "resolution_criteria": "Based on the official FOMC statement released after the March 2026 meeting. A cut of any size counts as YES.",
      "deadline": "2026-03-20T00:00:00Z",
      "metadata": {}
    }
  }'
echo ""

# ── Category B: CEO Resignation ────────────────────
echo ""
echo "══════════════════════════════════════════════════"
echo "▸ Category B: OpenAI CEO"
echo "══════════════════════════════════════════════════"
curl -s -X POST "$BASE_URL/api/resolve" \
  -H "Content-Type: application/json" \
  -d '{
    "market": {
      "marketId": "MKT-005",
      "question": "Will the CEO of OpenAI resign or be removed before July 1, 2026?",
      "resolution_criteria": "Official announcement from OpenAI or the CEO confirming resignation or removal.",
      "deadline": "2026-07-01T00:00:00Z",
      "metadata": {}
    }
  }'
echo ""

# ── Category C: Subjective ─────────────────────────
echo ""
echo "══════════════════════════════════════════════════"
echo "▸ Category C: AI Sentience (should reject)"
echo "══════════════════════════════════════════════════"
curl -s -X POST "$BASE_URL/api/resolve" \
  -H "Content-Type: application/json" \
  -d '{
    "market": {
      "marketId": "MKT-006",
      "question": "Will AI become sentient by 2030?",
      "resolution_criteria": "General consensus among AI researchers.",
      "deadline": "2030-12-31T23:59:59Z",
      "metadata": {}
    }
  }'
echo ""

# ── Malformed ──────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════════"
echo "▸ Malformed: No deadline (should reject)"
echo "══════════════════════════════════════════════════"
curl -s -X POST "$BASE_URL/api/resolve" \
  -H "Content-Type: application/json" \
  -d '{
    "market": {
      "marketId": "MKT-009",
      "question": "Will Dogecoin reach $1?",
      "resolution_criteria": "",
      "deadline": "",
      "metadata": {}
    }
  }'
echo ""

echo ""
echo "══════════════════════════════════════════════════"
echo "  Tests complete"
echo "══════════════════════════════════════════════════"
echo ""
