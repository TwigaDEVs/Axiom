export const CONTRACT_ADDRESS = "0x5876d6770Edd34a1c04fb83C217F1CAE69674c78";

export const CHAIN_CONFIG = {
  chainId: "0xaa36a7", // Arbitrum Sepolia
  chainName: "Ethereum Sepolia",
  rpcUrls: ["https://ethereum-sepolia.rpc.subquery.network/public"],
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  blockExplorerUrls: ["https://sepolia.etherscan.io"],
};

export const OUTCOME_LABELS = [
  "Unresolved",
  "Yes",
  "No",
  "Undetermined",
] as const;
export const OUTCOME_COLORS = [
  "#6b7280",
  "#22c55e",
  "#ef4444",
  "#f59e0b",
] as const;

export const ACTION_LABELS = ["Settle", "Defer", "Escalate", "Reject"] as const;
export const ACTION_COLORS = [
  "#22c55e",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
] as const;

export const CATEGORY_LABELS = [
  "Category A · Deterministic",
  "Category B · Event-based",
  "Category C · Subjective",
  "Malformed",
] as const;

export function shortenAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function formatConfidence(bps: number): string {
  return `${(bps / 100).toFixed(1)}%`;
}

export function formatDeadline(timestamp: bigint | number): string {
  return new Date(Number(timestamp) * 1000).toLocaleString();
}

export function isExpired(timestamp: bigint | number): boolean {
  return Date.now() > Number(timestamp) * 1000;
}

export function generateMarketId(): string {
  return `mkt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
