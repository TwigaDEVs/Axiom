# Oracle Engine

AI-powered prediction market resolution service. Receives markets from Chainlink CRE, classifies them, gathers evidence, and returns confidence-scored verdicts for on-chain settlement.

## Architecture

```
CRE Workflow → POST /api/resolve → Oracle Engine
                                      │
                                      ├── Classifier Agent (Anthropic)
                                      │     └── CATEGORY_A / B / C / MALFORMED
                                      │
                                      ├── Category A Path
                                      │     └── Deterministic Parser (Anthropic)
                                      │           └── Structured spec for data endpoint resolution
                                      │
                                      ├── Category B Path
                                      │     ├── Evidence Planner (Anthropic)
                                      │     ├── Evidence Gatherer (GNews, Google News RSS)
                                      │     └── Evidence Evaluator (Anthropic)
                                      │           └── Confidence-scored verdict + evidence trail
                                      │
                                      └── Category C / Malformed
                                            └── Rejected with reasoning
```

## Setup

```bash
npm install
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
# Optionally add GNEWS_API_KEY for enhanced evidence gathering
npm run dev
```

## API

### `GET /api/health`
Health check.

### `POST /api/resolve`
Resolve a single market.

```json
{
  "market": {
    "marketId": "MKT-001",
    "question": "Will BTC close above $100,000 on March 1, 2026 at 00:00 UTC?",
    "resolution_criteria": "Use 1-hour TWAP BTC/USD across Binance, Coinbase, Kraken.",
    "deadline": "2026-03-01T00:00:00Z",
    "metadata": {}
  }
}
```

Response:
```json
{
  "success": true,
  "result": {
    "marketId": "MKT-001",
    "category": "CATEGORY_A",
    "outcome": "UNDETERMINED",
    "confidence": 1.0,
    "settlement_action": "DEFER",
    "reasoning": "Market parsed as CRYPTO_PRICE_TWAP...",
    "evidence_trail": { ... },
    "deterministic_spec": { ... },
    "resolved_at": "2026-02-17T..."
  }
}
```

### `POST /api/resolve/batch`
Resolve multiple markets.

```json
{
  "markets": [ ... ]
}
```

## Settlement Logic

| Confidence | Action | Description |
|-----------|--------|-------------|
| ≥ 85% | SETTLE | Auto-settle on-chain |
| 70-84% | DEFER | Recheck after time window |
| < 70% | ESCALATE | Flag for dispute resolution |
| — | REJECT | Market not suitable for resolution |

## Project Structure

```
src/
├── agents/
│   ├── prompts/
│   │   ├── classifier.ts            # Market classification prompt
│   │   ├── deterministic-parser.ts   # Category A spec extraction prompt
│   │   ├── evidence-planner.ts       # Category B search planning prompt
│   │   └── evidence-evaluator.ts     # Category B evidence evaluation prompt
│   ├── classifier.ts                 # Agent 0 — classify market
│   ├── deterministic-parser.ts       # Agent 1 — parse deterministic spec
│   ├── evidence-planner.ts           # Agent 1B — plan evidence gathering
│   └── evidence-evaluator.ts         # Agent 2 — evaluate evidence corpus
├── services/
│   ├── anthropic.ts                  # Anthropic API wrapper
│   ├── evidence-gatherer.ts          # News API fetcher (GNews, RSS)
│   └── pipeline.ts                   # Main resolution pipeline
├── routes/
│   └── index.ts                      # Express routes
├── types/
│   └── index.ts                      # Type definitions
└── index.ts                          # Server entry point
```

## LLM Calls Per Resolution

| Category | LLM Calls | External API Calls |
|----------|-----------|-------------------|
| A | 2 (classify + parse) | 0 |
| B | 3 (classify + plan + evaluate) | 3-10 (news APIs) |
| C | 1 (classify) | 0 |
