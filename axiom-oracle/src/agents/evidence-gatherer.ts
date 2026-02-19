import { EvidenceSource, EvidenceCorpus } from "../types";
import { EvidencePlan } from "../agents/evidence-planner";

/**
 * Evidence Gathering Service
 *
 * Fetches raw evidence from external sources based on an evidence plan.
 * Uses time_window from the plan to filter results to the relevant period.
 *
 * Supports:
 * - GNews API (free tier: 100 req/day) — best quality, real descriptions, date filtering
 * - Google News RSS (free, no key) — fallback, time-filtered via query operators
 */

const GNEWS_API_KEY = process.env.GNEWS_API_KEY || "";
const GNEWS_BASE = "https://gnews.io/api/v4/search";

// ─── Time Window Helpers ──────────────────────────────────────────

/**
 * Parse the evidence plan's time_window into ISO date strings.
 * Handles relative values like "last_30_days" and absolute ISO dates.
 */
function parseTimeWindow(timeWindow: { from: string; to: string }): {
  from: string;
  to: string;
} {
  const now = new Date();

  let fromDate: string;
  if (timeWindow.from.includes("last_")) {
    const days = parseInt(timeWindow.from.replace(/\D/g, "")) || 30;
    const d = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    fromDate = d.toISOString().slice(0, 10);
  } else if (timeWindow.from.length === 10) {
    fromDate = timeWindow.from;
  } else {
    fromDate = new Date(timeWindow.from).toISOString().slice(0, 10);
  }

  let toDate: string;
  if (timeWindow.to === "now" || !timeWindow.to) {
    toDate = now.toISOString().slice(0, 10);
  } else if (timeWindow.to.length === 10) {
    toDate = timeWindow.to;
  } else {
    toDate = new Date(timeWindow.to).toISOString().slice(0, 10);
  }

  return { from: fromDate, to: toDate };
}

// ─── GNews API ────────────────────────────────────────────────────

/**
 * Fetch from GNews API with date filtering.
 * GNews supports `from` and `to` params in ISO format.
 */
async function searchGNews(
  query: string,
  timeWindow: { from: string; to: string },
  maxResults: number = 5
): Promise<EvidenceSource[]> {
  if (!GNEWS_API_KEY) return [];

  try {
    const params = new URLSearchParams({
      q: query,
      lang: "en",
      max: String(maxResults),
      from: `${timeWindow.from}T00:00:00Z`,
      to: `${timeWindow.to}T23:59:59Z`,
      apikey: GNEWS_API_KEY,
    });

    const resp = await fetch(`${GNEWS_BASE}?${params}`);
    if (!resp.ok) {
      console.error(`GNews error: ${resp.status} for query: ${query}`);
      return [];
    }

    const data = (await resp.json()) as { articles?: any[] };
    const articles = data.articles || [];

    return articles.map((a: any) => ({
      title: a.title || "Untitled",
      url: a.url || "",
      snippet: (a.description || a.content?.slice(0, 500) || "").trim(),
      source_type: classifySourceType(a.source?.name || ""),
      published_date: a.publishedAt || undefined,
    }));
  } catch (err) {
    console.error(`GNews search failed for: ${query}`, err);
    return [];
  }
}

// ─── Google News RSS ──────────────────────────────────────────────

/**
 * Fetch from Google News RSS with date filtering via query operators.
 * Google News supports `before:YYYY-MM-DD` and `after:YYYY-MM-DD` in the query.
 */
async function searchGoogleNewsRSS(
  query: string,
  timeWindow: { from: string; to: string },
  maxResults: number = 5
): Promise<EvidenceSource[]> {
  try {
    const timeFilteredQuery = `${query} after:${timeWindow.from} before:${timeWindow.to}`;
    const encoded = encodeURIComponent(timeFilteredQuery);
    const url = `https://news.google.com/rss/search?q=${encoded}&hl=en-US&gl=US&ceid=US:en`;

    const resp = await fetch(url);
    if (!resp.ok) return [];

    const xml = await resp.text();
    return parseRSSItems(xml, maxResults);
  } catch {
    console.error(`Google News RSS failed for: ${query}`);
    return [];
  }
}

/**
 * RSS XML parser — extracts items with proper content handling.
 */
function parseRSSItems(xml: string, max: number): EvidenceSource[] {
  const items: EvidenceSource[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null && items.length < max) {
    const block = match[1];
    const title = extractTag(block, "title");
    const pubDate = extractTag(block, "pubDate");
    const source = extractTagAttribute(block, "source", "url") || extractTag(block, "source");
    const sourceName = extractTag(block, "source");

    // Google News RSS <link> is plain text between tags, not CDATA
    const link = extractLink(block);

    // Google News RSS <description> contains HTML — extract readable text
    const rawDescription = extractTag(block, "description");
    const snippet = extractReadableText(rawDescription);

    if (!title && !snippet) continue;

    items.push({
      title: cleanEntities(title),
      url: link,
      snippet: snippet.slice(0, 500),
      source_type: classifySourceType(sourceName || source),
      published_date: pubDate || undefined,
    });
  }

  return items;
}

/**
 * Extract <link> from RSS item.
 * Google News puts the URL as plain text after <link/> or <link> tag.
 */
function extractLink(block: string): string {
  const standard = extractTag(block, "link");
  if (standard && standard.startsWith("http")) return standard;

  const linkMatch = block.match(/<link\s*\/?>\s*(https?:\/\/[^\s<]+)/);
  if (linkMatch) return linkMatch[1].trim();

  const urlMatch = block.match(/https?:\/\/news\.google\.com\/rss\/articles\/[^\s<"]+/);
  if (urlMatch) return urlMatch[0];

  return "";
}

/**
 * Extract readable text from Google News RSS description HTML.
 * Converts <a> tags to their text content and <font> tags to source attribution.
 */
function extractReadableText(html: string): string {
  if (!html) return "";

  let text = html;

  // <a> tags → their visible text
  text = text.replace(/<a[^>]*>([^<]*)<\/a>/g, "$1");

  // <font> tags (source names) → attribution
  text = text.replace(/<font[^>]*>([^<]*)<\/font>/g, "($1)");

  // Remove remaining HTML tags
  text = text.replace(/<[^>]*>/g, " ");

  // Clean entities and whitespace
  text = cleanEntities(text);
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

function extractTag(xml: string, tag: string): string {
  const cdataRegex = new RegExp(
    `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`
  );
  const cdataMatch = cdataRegex.exec(xml);
  if (cdataMatch) return cdataMatch[1].trim();

  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`);
  const match = regex.exec(xml);
  return match ? match[1].trim() : "";
}

function extractTagAttribute(
  xml: string,
  tag: string,
  attr: string
): string {
  const regex = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"[^>]*>`);
  const match = regex.exec(xml);
  return match ? match[1] : "";
}

function cleanEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

// ─── Source Classification ────────────────────────────────────────

function classifySourceType(sourceName: string): EvidenceSource["source_type"] {
  const name = sourceName.toLowerCase();

  const wireServices = [
    "reuters", "associated press", "ap news", "afp", "bloomberg",
  ];
  const official = [
    "gov", ".gov", "federal reserve", "sec.gov", "whitehouse",
    "federalreserve.gov", "treasury",
  ];
  const mainstream = [
    "nyt", "new york times", "washington post", "bbc", "cnn", "cnbc",
    "guardian", "ft", "financial times", "wall street journal", "wsj",
    "abc news", "nbc", "cbs", "fox news", "usa today", "politico",
    "the hill", "axios",
  ];
  const tradePress = [
    "coindesk", "the block", "techcrunch", "arstechnica", "wired",
    "the verge", "decrypt", "cointelegraph",
  ];

  if (wireServices.some((w) => name.includes(w))) return "wire_service";
  if (official.some((o) => name.includes(o))) return "official";
  if (mainstream.some((m) => name.includes(m))) return "mainstream_news";
  if (tradePress.some((t) => name.includes(t))) return "trade_press";

  return "unknown";
}

// ─── Deduplication ────────────────────────────────────────────────

function deduplicateSources(sources: EvidenceSource[]): EvidenceSource[] {
  const seen = new Set<string>();
  return sources.filter((s) => {
    if (!s.url || seen.has(s.url)) return false;
    seen.add(s.url);
    return true;
  });
}

// ─── Main Entry ───────────────────────────────────────────────────

/**
 * Main evidence gathering function.
 * Takes an evidence plan and returns a corpus of sources.
 * Uses the plan's time_window to filter results to the relevant period.
 */
export async function gatherEvidence(plan: EvidencePlan): Promise<EvidenceCorpus> {
  const allSources: EvidenceSource[] = [];

  const timeWindow = parseTimeWindow(plan.time_window);

  console.log(`  [EVIDENCE] Gathering for ${plan.search_queries.length} queries`);
  console.log(`  [EVIDENCE] Time window: ${timeWindow.from} to ${timeWindow.to}`);

  const searchPromises = plan.search_queries.flatMap((query) => [
    searchGoogleNewsRSS(query, timeWindow, 3),
    searchGNews(query, timeWindow, 3),
  ]);

  const results = await Promise.allSettled(searchPromises);

  for (const result of results) {
    if (result.status === "fulfilled") {
      allSources.push(...result.value);
    }
  }

  const deduplicated = deduplicateSources(allSources);

  console.log(`  [EVIDENCE] Found ${deduplicated.length} unique sources`);

  return {
    query_used: plan.search_queries,
    sources: deduplicated,
    gathered_at: new Date().toISOString(),
  };
}