import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Contract, BrowserProvider } from "ethers";
import MarketCard from "./MarketCard";
import Spinner from "./Spinner";
import type { MarketEntry, MarketData } from "../types/market";

interface Props {
  getReadContract: () => Contract | null;
  provider: BrowserProvider | null;
}

type Filter = "all" | "active" | "resolved";

export default function MarketsList({ getReadContract, provider }: Props) {
  const navigate = useNavigate();
  const [markets, setMarkets] = useState<MarketEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadMarkets();
  }, [provider]);

  const loadMarkets = async () => {
    setLoading(true);
    try {
      const contract = getReadContract();
      if (!contract) {
        setLoading(false);
        return;
      }

      const createdFilter = contract.filters.MarketCreated();
      const events = await contract.queryFilter(createdFilter, 0, "latest");

      const loaded: MarketEntry[] = [];
      for (const event of events) {
        try {
          const args = (event as any).args;
          const marketId: string = args[0];
          const data: MarketData = await contract.getMarket(marketId);
          if (data.question) {
            loaded.push({ marketId, market: data });
          }
        } catch {
          // skip
        }
      }

      setMarkets(loaded.reverse());
    } catch (err) {
      console.error("Failed to load markets:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = markets.filter(({ marketId, market }) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !market.question.toLowerCase().includes(q) &&
        !marketId.toLowerCase().includes(q)
      )
        return false;
    }
    if (filter === "active") return !market.resolved;
    if (filter === "resolved") return market.resolved;
    return true;
  });

  const filters: Filter[] = ["all", "active", "resolved"];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight mb-1">Markets</h1>
        <p className="text-text-secondary text-[15px]">
          Browse and track prediction markets resolved by the oracle
        </p>
      </div>

      {/* Search + Filters */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-base pointer-events-none">
            ⌕
          </span>
          <input
            className="w-full pl-10 pr-4 py-3 bg-bg-card border border-border rounded-xl text-text-primary text-[15px] outline-none transition-all focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-glow)]"
            placeholder="Search markets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 p-1 bg-bg-card border border-border rounded-xl">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-all cursor-pointer ${
                filter === f
                  ? "bg-accent text-white"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-text-secondary">
          <Spinner />
          <span>Loading markets from chain…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4 opacity-30">📊</div>
          <h3 className="text-xl font-bold text-text-secondary mb-2">
            {markets.length === 0 ? "No markets yet" : "No matches"}
          </h3>
          <p className="text-text-muted text-sm mb-6">
            {markets.length === 0
              ? "Create the first prediction market to get started."
              : "Try a different search or filter."}
          </p>
          {markets.length === 0 && (
            <button
              onClick={() => navigate("/create")}
              className="px-6 py-3 bg-accent text-white font-semibold rounded-xl hover:bg-accent-hover transition-all cursor-pointer"
            >
              Create Market
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(({ marketId, market }) => (
            <MarketCard key={marketId} marketId={marketId} market={market} />
          ))}
        </div>
      )}
    </div>
  );
}
