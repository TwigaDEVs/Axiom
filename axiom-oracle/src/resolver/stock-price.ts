import { DataFetcher, FetchResult } from "./base";

const AV_BASE = "https://www.alphavantage.co/query";

export class StockPriceFetcher implements DataFetcher {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY || "";
  }

  async fetch(spec: Record<string, unknown>): Promise<FetchResult> {
    if (!this.apiKey) {
      return {
        success: false,
        data: {},
        source: "alpha_vantage",
        fetched_at: new Date().toISOString(),
        error: "ALPHA_VANTAGE_API_KEY not configured",
      };
    }

    try {
      const ticker = (spec.ticker as string) || "";
      const resolutionDate = (spec.resolution_date as string) || "";

      // Use GLOBAL_QUOTE for current/recent, TIME_SERIES_DAILY for historical
      const url =
        `${AV_BASE}?function=TIME_SERIES_DAILY` +
        `&symbol=${ticker}` +
        `&outputsize=compact` +
        `&apikey=${this.apiKey}`;

      const resp = await fetch(url);
      if (!resp.ok) {
        return {
          success: false,
          data: {},
          source: "alpha_vantage",
          fetched_at: new Date().toISOString(),
          error: `Alpha Vantage API error: ${resp.status}`,
        };
      }

      const data = (await resp.json()) as any;

      // Check for API error messages (rate limit, invalid key, etc)
      if (data["Error Message"]) {
        return {
          success: false,
          data: {},
          source: "alpha_vantage",
          fetched_at: new Date().toISOString(),
          error: `Alpha Vantage error: ${data["Error Message"]}`,
        };
      }

      if (data["Note"]) {
        return {
          success: false,
          data: {},
          source: "alpha_vantage",
          fetched_at: new Date().toISOString(),
          error: `Alpha Vantage rate limit: ${data["Note"]}`,
        };
      }

      const timeSeries = data["Time Series (Daily)"] || {};
      const dateKey = resolutionDate.slice(0, 10); // YYYY-MM-DD

      // Try exact date, then find closest available
      let matchedDate = dateKey;
      let dayData = timeSeries[dateKey];

      if (!dayData) {
        // Find closest available date
        const dates = Object.keys(timeSeries).sort().reverse();
        matchedDate = dates.find((d) => d <= dateKey) || dates[0] || "";
        dayData = timeSeries[matchedDate];
      }

      if (!dayData) {
        return {
          success: false,
          data: { ticker, requested_date: dateKey },
          source: "alpha_vantage",
          fetched_at: new Date().toISOString(),
          error: `No data available for ${ticker} on or before ${dateKey}`,
        };
      }

      return {
        success: true,
        data: {
          ticker,
          date: matchedDate,
          requested_date: dateKey,
          exact_date_match: matchedDate === dateKey,
          open: parseFloat(dayData["1. open"]),
          high: parseFloat(dayData["2. high"]),
          low: parseFloat(dayData["3. low"]),
          close: parseFloat(dayData["4. close"]),
          volume: parseInt(dayData["5. volume"]),
        },
        source: "alpha_vantage",
        fetched_at: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        data: {},
        source: "alpha_vantage",
        fetched_at: new Date().toISOString(),
        error: `Fetch failed: ${error}`,
      };
    }
  }
}
