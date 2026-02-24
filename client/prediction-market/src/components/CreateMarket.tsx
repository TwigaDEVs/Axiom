import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { Contract, Signer } from "ethers";
import toast from "react-hot-toast";
import Spinner from "./Spinner";
import { generateMarketId } from "../utils/constants";

interface Props {
  signer: Signer | null;
  getWriteContract: () => Contract | null;
  address: string | null;
}

interface FormState {
  marketId: string;
  question: string;
  criteria: string;
  deadline: string;
  metadataUri: string;
}

export default function CreateMarket({ signer, getWriteContract, address }: Props) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>({
    marketId: generateMarketId(),
    question: "",
    criteria: "",
    deadline: "",
    metadataUri: "",
  });

  const update = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!address) return toast.error("Connect your wallet first");
    if (!form.question.trim()) return toast.error("Question is required");
    if (!form.criteria.trim()) return toast.error("Resolution criteria is required");
    if (!form.deadline) return toast.error("Deadline is required");

    const deadlineUnix = Math.floor(new Date(form.deadline).getTime() / 1000);
    if (deadlineUnix <= Math.floor(Date.now() / 1000)) {
      return toast.error("Deadline must be in the future");
    }

    setLoading(true);
    try {
      const contract = getWriteContract();
      if (!contract) throw new Error("No contract");
      const tx = await contract.createMarket(
        form.marketId,
        form.question,
        form.criteria,
        deadlineUnix,
        form.metadataUri
      );
      toast.loading("Transaction pending…", { id: "tx" });
      await tx.wait();
      toast.success("Market created!", { id: "tx" });
      navigate(`/market/${encodeURIComponent(form.marketId)}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.reason || err.message || "Transaction failed", { id: "tx" });
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 bg-bg border border-border rounded-xl text-text-primary text-[15px] outline-none transition-all focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-glow)] placeholder:text-text-muted";

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight mb-1">Create Market</h1>
        <p className="text-text-secondary text-[15px]">
          Deploy a new prediction market on-chain
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-bg-card border border-border rounded-2xl p-6 animate-fade-in"
      >
        {/* Market ID */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
            Market ID
          </label>
          <input
            className={`${inputClass} font-mono !text-[13px]`}
            value={form.marketId}
            onChange={update("marketId")}
          />
          <p className="text-xs text-text-muted mt-1">Auto-generated. You can customize this.</p>
        </div>

        {/* Question */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
            Question
          </label>
          <input
            className={inputClass}
            placeholder="Will BTC exceed $100k before June 2025?"
            value={form.question}
            onChange={update("question")}
          />
        </div>

        {/* Criteria */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
            Resolution Criteria
          </label>
          <textarea
            className={`${inputClass} min-h-[100px] resize-y !text-sm`}
            placeholder="Resolves YES if Bitcoin's price on CoinGecko exceeds $100,000 at any point before the deadline."
            value={form.criteria}
            onChange={update("criteria")}
          />
          <p className="text-xs text-text-muted mt-1">
            Be specific. The oracle uses this to determine how to resolve.
          </p>
        </div>

        {/* Deadline */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
            Deadline
          </label>
          <input
            type="datetime-local"
            className={inputClass}
            value={form.deadline}
            onChange={update("deadline")}
          />
        </div>

        {/* Metadata */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
            Metadata URI (optional)
          </label>
          <input
            className={inputClass}
            placeholder="ipfs://… or https://…"
            value={form.metadataUri}
            onChange={update("metadataUri")}
          />
          <p className="text-xs text-text-muted mt-1">
            Link to additional metadata (IPFS, Arweave, etc.)
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !address}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-accent text-white font-semibold text-base rounded-xl transition-all hover:bg-accent-hover hover:shadow-[0_4px_16px_rgba(99,102,241,0.3)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
        >
          {loading ? (
            <>
              <Spinner className="!border-white/30 !border-t-white" /> Creating…
            </>
          ) : (
            "Create Market"
          )}
        </button>

        {!address && (
          <p className="text-center mt-3 text-text-muted text-[13px]">
            Connect your wallet to create a market
          </p>
        )}
      </form>
    </div>
  );
}
