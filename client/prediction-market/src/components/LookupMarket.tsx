import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { Contract } from "ethers";
import toast from "react-hot-toast";
import Spinner from "./Spinner";

interface Props {
  getReadContract: () => Contract | null;
}

export default function LookupMarket({ getReadContract }: Props) {
  const navigate = useNavigate();
  const [marketId, setMarketId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLookup = async (e: FormEvent) => {
    e.preventDefault();
    if (!marketId.trim()) return toast.error("Enter a market ID");

    setLoading(true);
    try {
      const contract = getReadContract();
      if (!contract) {
        toast.error("No provider available");
        return;
      }
      const exists = await contract.marketExists(marketId.trim());
      if (!exists) {
        toast.error("Market not found on-chain");
        return;
      }
      navigate(`/market/${encodeURIComponent(marketId.trim())}`);
    } catch (err) {
      console.error(err);
      toast.error("Lookup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight mb-1">Lookup Market</h1>
        <p className="text-text-secondary text-[15px]">
          Enter a market ID to view its details and resolution data
        </p>
      </div>

      <form
        onSubmit={handleLookup}
        className="bg-bg-card border border-border rounded-2xl p-6 animate-fade-in"
      >
        <div className="mb-5">
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
            Market ID
          </label>
          <input
            className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-text-primary font-mono text-[13px] outline-none transition-all focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-glow)] placeholder:text-text-muted"
            placeholder="mkt_abc123…"
            value={marketId}
            onChange={(e) => setMarketId(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-accent text-white font-semibold rounded-xl transition-all hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <>
              <Spinner className="!border-white/30 !border-t-white" /> Looking up…
            </>
          ) : (
            "View Market"
          )}
        </button>
      </form>
    </div>
  );
}
