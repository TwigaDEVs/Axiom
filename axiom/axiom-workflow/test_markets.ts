import { MarketInput } from "./types";

export const TEST_MARKETS: MarketInput[] = [
  // ── Clear Category A ─────────────────────────────────────
  // {
  //   marketId: "MKT-001",
  //   question: "Will BTC close above $100,000 on March 1, 2026 at 00:00 UTC?",
  //   resolution_criteria:
  //     "Use 1-hour TWAP BTC/USD across Binance, Coinbase, Kraken.",
  //   deadline: "2026-03-01T00:00:00Z",
  //   metadata: { creator: "test", collateral: "USDC" },
  // },
  // {
  //   marketId: "MKT-002",
  //   question: "Will the Lakers beat the Celtics on February 20, 2026?",
  //   resolution_criteria:
  //     "Official NBA final score. Lakers must win (OT rules apply as per NBA).",
  //   deadline: "2026-02-21T00:00:00Z",
  //   metadata: {},
  // },
  // {
  //   marketId: "MKT-003",
  //   question:
  //     "Will total ETH staked on the Beacon Chain exceed 40 million ETH by March 31, 2026?",
  //   resolution_criteria:
  //     "Query the Ethereum beacon chain deposit contract. Total staked ETH must be > 40,000,000.",
  //   deadline: "2026-03-31T23:59:59Z",
  //   metadata: {},
  // },
  // {
  //   marketId: "MKT-010",
  //   question:
  //     "Will the temperature in New York City exceed 100°F at any point on July 4, 2026?",
  //   resolution_criteria:
  //     "Based on the official NOAA weather station reading for Central Park, NYC. Max temperature must exceed 100°F.",
  //   deadline: "2026-07-05T00:00:00Z",
  //   metadata: {},
  // },

  // // ── Clear Category B ─────────────────────────────────────
  // {
  //   marketId: "MKT-004",
  //   question:
  //     "Will the Federal Reserve cut interest rates at the March 2026 FOMC meeting?",
  //   resolution_criteria:
  //     "Based on the official FOMC statement released after the March 2026 meeting. A cut of any size counts as YES.",
  //   deadline: "2026-03-20T00:00:00Z",
  //   metadata: {},
  // },
  // {
  //   marketId: "MKT-005",
  //   question:
  //     "Will the CEO of OpenAI resign or be removed before July 1, 2026?",
  //   resolution_criteria:
  //     "Official announcement from OpenAI or the CEO confirming resignation or removal. Temporary leave does not count.",
  //   deadline: "2026-07-01T00:00:00Z",
  //   metadata: {},
  // },
  // {
  //   marketId: "MKT-011",
  //   question:
  //     "Will Manchester City win the 2025-2026 Premier League title?",
  //   resolution_criteria:
  //     "Based on the official Premier League final standings at end of season.",
  //   deadline: "2026-06-01T00:00:00Z",
  //   metadata: {},
  // },
  // {
  //   marketId: "MKT-012",
  //   question:
  //     "Will the US pass a federal stablecoin regulation bill before October 2026?",
  //   resolution_criteria:
  //     "A bill specifically addressing stablecoin regulation must be signed into law by the President.",
  //   deadline: "2026-10-01T00:00:00Z",
  //   metadata: {},
  // },

  // // ── Clear Category C ─────────────────────────────────────
  {
    marketId: "MKT-006",
    question: "Will AI become sentient by 2030?",
    resolution_criteria: "General consensus among AI researchers.",
    deadline: "2030-12-31T23:59:59Z",
    metadata: {},
  },

  // // ── Boundary / Edge Cases ────────────────────────────────
  // {
  //   marketId: "MKT-007",
  //   question:
  //     "Will NVDA close above $200 on the first trading day after Q1 2026 earnings?",
  //   resolution_criteria:
  //     "NASDAQ official closing price for NVDA on the first full trading day following Nvidia's Q1 2026 earnings release.",
  //   deadline: "2026-06-01T00:00:00Z",
  //   metadata: {},
  // },
  // {
  //   marketId: "MKT-008",
  //   question: "Will there be a major crypto hack in Q1 2026?",
  //   resolution_criteria:
  //     "A hack resulting in loss of funds from a cryptocurrency protocol or exchange.",
  //   deadline: "2026-03-31T23:59:59Z",
  //   metadata: {},
  // },

  // // ── Malformed ────────────────────────────────────────────
  // {
  //   marketId: "MKT-009",
  //   question: "Will Dogecoin reach $1?",
  //   resolution_criteria: "",
  //   deadline: "",
  //   metadata: {},
  // },
];