/**
 * Base interface for all data fetchers.
 * Each strategy type implements this to fetch raw data from its API.
 */
export interface FetchResult {
  success: boolean;
  data: Record<string, unknown>;
  source: string;
  fetched_at: string;
  error?: string;
}

export interface DataFetcher {
  fetch(spec: Record<string, unknown>): Promise<FetchResult>;
}
