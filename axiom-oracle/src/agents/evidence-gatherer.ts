import { EvidenceSource, EvidenceCorpus } from "../types";
import { EvidencePlan } from "./evidence-planner";


/**
 * Evidence Gathering Service
 *
 * This is the cheap, non-LLM layer that fetches raw evidence from
 * external sources. It takes a structured plan from the Evidence Planner
 * agent and executes the searches.
 *
 * Currently supports:
 * - GNews API (free tier: 100 req/day)
 * - Google News RSS (free, no key)
 *
 * Easily extensible to add:
 * - GDELT API
 * - NewsAPI.org
 * - Custom scrapers
 */

const GNEWS_API_KEY = process.env.GNEWS_API_KEY || "";
const GNEWS_BASE = "https://gnews.io/api/v4/search";

/**
 * Fetch from GNews API.
 */
async function searchGNews(query: string, maxResults: number = 5): Promise<EvidenceSource[]> {
  if (!GNEWS_API_KEY) return [];

  try {
    const params = new URLSearchParams({
      q: query,
      lang: "en",
      max: String(maxResults),
      apikey: GNEWS_API_KEY,
    });

    const resp = await fetch(`${GNEWS_BASE}?${params}`);
    if (!resp.ok) return [];

    const data = (await resp.json()) as { articles?: any[] };
    const articles = data.articles || [];

    return articles.map((a: any) => ({
      title: a.title || "Untitled",
      url: a.url || "",
      snippet: a.description || a.content?.slice(0, 300) || "",
      source_type: classifySourceType(a.source?.name || ""),
      published_date: a.publishedAt || undefined,
    }));
  } catch {
    console.error(`GNews search failed for: ${query}`);
    return [];
  }
}

/**
 * Fetch from Google News RSS (free, no key).
 */
async function searchGoogleNewsRSS(query: string, maxResults: number = 5): Promise<EvidenceSource[]> {
  try {
    const encoded = encodeURIComponent(query);
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
 * Simple RSS XML parser — extracts items without external dependencies.
 */
function parseRSSItems(xml: string, max: number): EvidenceSource[] {
  const items: EvidenceSource[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null && items.length < max) {
    const block = match[1];
    const title = extractTag(block, "title");
    const link = extractTag(block, "link");
    const description = extractTag(block, "description");
    const pubDate = extractTag(block, "pubDate");
    const source = extractTag(block, "source");

    items.push({
      title: cleanHTML(title),
      url: link,
      snippet: cleanHTML(description).slice(0, 300),
      source_type: classifySourceType(source),
      published_date: pubDate || undefined,
    });
  }

  return items;
}

function extractTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`);
  const match = regex.exec(xml);
  return match ? (match[1] || match[2] || "").trim() : "";
}

function cleanHTML(text: string): string {
  return text.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').trim();
}

/**
 * Heuristic source type classification based on domain/name.
 */
function classifySourceType(sourceName: string): EvidenceSource["source_type"] {
  const name = sourceName.toLowerCase();

  const wireServices = ["reuters", "associated press", "ap news", "afp", "bloomberg"];
  const official = ["gov", ".gov", "federal reserve", "sec.gov", "whitehouse"];
  const mainstream = ["nyt", "new york times", "washington post", "bbc", "cnn", "cnbc", "guardian", "ft", "financial times", "wall street journal", "wsj"];
  const tradePpress = ["coindesk", "the block", "techcrunch", "arstechnica", "wired", "the verge"];

  if (wireServices.some((w) => name.includes(w))) return "wire_service";
  if (official.some((o) => name.includes(o))) return "official";
  if (mainstream.some((m) => name.includes(m))) return "mainstream_news";
  if (tradePpress.some((t) => name.includes(t))) return "trade_press";

  return "unknown";
}

/**
 * Deduplicate sources by URL.
 */
function deduplicateSources(sources: EvidenceSource[]): EvidenceSource[] {
  const seen = new Set<string>();
  return sources.filter((s) => {
    if (!s.url || seen.has(s.url)) return false;
    seen.add(s.url);
    return true;
  });
}

/**
 * Main evidence gathering function.
 * Takes an evidence plan and returns a corpus of sources.
 */
export async function gatherEvidence(plan: EvidencePlan): Promise<EvidenceCorpus> {
  const allSources: EvidenceSource[] = [];

  // Run searches in parallel across providers
  const searchPromises = plan.search_queries.flatMap((query) => [
    searchGoogleNewsRSS(query, 3),
    searchGNews(query, 3),
  ]);

  const results = await Promise.allSettled(searchPromises);

  for (const result of results) {
    if (result.status === "fulfilled") {
      allSources.push(...result.value);
    }
  }

  const deduplicated = deduplicateSources(allSources);

  return {
    query_used: plan.search_queries,
    sources: deduplicated,
    gathered_at: new Date().toISOString(),
  };
}
