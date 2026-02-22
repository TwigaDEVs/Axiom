import { DataFetcher, FetchResult } from "./base";

const BINANCE_BASE = "https://api.binance.com/api/v3";

/**
 * Maps common asset pairs to Binance symbol format.
 * e.g. BTC/USD → BTCUSDT, ETH/USD → ETHUSDT
 */
function toBinanceSymbol(pair: string): string {
  const cleaned = pair.replace("/", "").toUpperCase();
  // Binance uses USDT not USD
  if (cleaned.endsWith("USD") && !cleaned.endsWith("USDT")) {
    return cleaned + "T";
  }
  return cleaned;
}

export class CryptoPriceFetcher implements DataFetcher {
    /**
     * Fetch spot price for a crypto pair.
     */
  async fetchSpot(symbol: string, resolutionTime?: string): Promise<FetchResult> {
    try {
      // If resolution time is in the past, fetch historical candle
      if (resolutionTime) {
        const deadline = new Date(resolutionTime).getTime();
        const now = Date.now();

        if (deadline < now) {
          return this.fetchHistorical(symbol, deadline);
        }
      }

      // Otherwise fetch current spot
      const url = `${BINANCE_BASE}/ticker/price?symbol=${symbol}`;
      const resp = await fetch(url);

      if (!resp.ok) {
        return {
          success: false,
          data: {},
          source: "binance_spot",
          fetched_at: new Date().toISOString(),
          error: `Binance API error: ${resp.status} ${resp.statusText}`,
        };
      }

      const data = (await resp.json()) as { symbol: string; price: string };

      return {
        success: true,
        data: {
          symbol: data.symbol,
          price: parseFloat(data.price),
          raw_price: data.price,
          method: "SPOT",
        },
        source: "binance_spot",
        fetched_at: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        data: {},
        source: "binance_spot",
        fetched_at: new Date().toISOString(),
        error: `Fetch failed: ${error}`,
      };
    }
  }

  /**
   * Fetch historical price at a specific timestamp using klines.
   * Gets the 1-minute candle at the exact deadline time.
   */
  async fetchHistorical(symbol: string, timestampMs: number): Promise<FetchResult> {
    try {
      const url = `${BINANCE_BASE}/klines?symbol=${symbol}&interval=1m&startTime=${timestampMs}&limit=1`;
      const resp = await fetch(url);

      if (!resp.ok) {
        return {
          success: false,
          data: {},
          source: "binance_historical",
          fetched_at: new Date().toISOString(),
          error: `Binance API error: ${resp.status} ${resp.statusText}`,
        };
      }

      const klines = (await resp.json()) as any[];

      if (!klines.length) {
        return {
          success: false,
          data: {},
          source: "binance_historical",
          fetched_at: new Date().toISOString(),
          error: "No historical kline data for this timestamp",
        };
      }

      // kline format: [openTime, open, high, low, close, volume, closeTime, ...]
      const candle = klines[0];
      const openPrice = parseFloat(candle[1]);
      const closePrice = parseFloat(candle[4]);

      return {
        success: true,
        data: {
          symbol,
          price: closePrice,
          open_price: openPrice,
          raw_price: candle[4],
          method: "HISTORICAL",
          candle_open_time: new Date(candle[0]).toISOString(),
          candle_close_time: new Date(candle[6]).toISOString(),
        },
        source: "binance_historical",
        fetched_at: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        data: {},
        source: "binance_historical",
        fetched_at: new Date().toISOString(),
        error: `Historical fetch failed: ${error}`,
      };
    }
  }

  /**
   * Fetch klines and compute TWAP over a window.
   * window format: "1h", "4h", "24h"
   */
  async fetchTWAP(
    symbol: string,
    window: string = "1h"
  ): Promise<FetchResult> {
    try {
      // Parse window to determine kline interval and count
      const hours = parseInt(window.replace("h", "")) || 1;
      // Use 1m candles for 1h, 5m for longer
      const interval = hours <= 1 ? "1m" : "5m";
      const limit = hours <= 1 ? 60 : hours * 12;

      const url = `${BINANCE_BASE}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
      const resp = await fetch(url);

      if (!resp.ok) {
        return {
          success: false,
          data: {},
          source: "binance_twap",
          fetched_at: new Date().toISOString(),
          error: `Binance API error: ${resp.status}`,
        };
      }

      const klines = (await resp.json()) as any[];

      if (!klines.length) {
        return {
          success: false,
          data: {},
          source: "binance_twap",
          fetched_at: new Date().toISOString(),
          error: "No kline data returned",
        };
      }

      // TWAP = average of close prices across the window
      const closePrices = klines.map((k: any) => parseFloat(k[4]));
      const twap = closePrices.reduce((a: number, b: number) => a + b, 0) / closePrices.length;

      return {
        success: true,
        data: {
          symbol,
          price: twap,
          method: "TWAP",
          window,
          data_points: closePrices.length,
          period_start: new Date(klines[0][0]).toISOString(),
          period_end: new Date(klines[klines.length - 1][6]).toISOString(),
          high: Math.max(...closePrices),
          low: Math.min(...closePrices),
        },
        source: "binance_twap",
        fetched_at: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        data: {},
        source: "binance_twap",
        fetched_at: new Date().toISOString(),
        error: `Fetch failed: ${error}`,
      };
    }
  }

/**
 * Main fetch — routes to spot or TWAP, with historical awareness.
 */
async fetch(spec: Record<string, unknown>): Promise<FetchResult> {
  const pair = (spec.pair as string) || "BTC/USD";
  const symbol = toBinanceSymbol(pair);
  const method = (spec.aggregation_method as string) || "SPOT";
  const resolutionTime = spec.resolution_time as string | undefined;

  if (method === "TWAP") {
    const window = (spec.window as string) || "1h";
    return this.fetchTWAP(symbol, window);
  }

  return this.fetchSpot(symbol, resolutionTime);
}
}


