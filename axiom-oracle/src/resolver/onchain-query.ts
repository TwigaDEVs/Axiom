import { DataFetcher, FetchResult } from "./base";

const PUBLIC_RPCS: Record<string, string> = {
  ethereum: "https://cloudflare-eth.com",
  eth: "https://cloudflare-eth.com",
  polygon: "https://polygon-rpc.com",
  arbitrum: "https://arb1.arbitrum.io/rpc",
  optimism: "https://mainnet.optimism.io",
  base: "https://mainnet.base.org",
};

export class OnchainQueryFetcher implements DataFetcher {
  async fetch(spec: Record<string, unknown>): Promise<FetchResult> {
    try {
      const chain = ((spec.chain as string) || "ethereum").toLowerCase();
      const rpcUrl = PUBLIC_RPCS[chain];

      if (!rpcUrl) {
        return {
          success: false,
          data: {},
          source: "onchain_rpc",
          fetched_at: new Date().toISOString(),
          error: `Unsupported chain: ${chain}. Supported: ${Object.keys(PUBLIC_RPCS).join(", ")}`,
        };
      }

      const contractAddress = spec.contract_address as string;
      const metric = (spec.metric as string) || "";

      // For generic balance/state queries, use eth_call or eth_getBalance
      // This is a simplified implementation — production would need ABI encoding
      if (metric.toLowerCase().includes("balance") || metric.toLowerCase().includes("staked")) {
        // Get ETH balance if it's an address query
        if (contractAddress) {
          const resp = await fetch(rpcUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              method: "eth_getBalance",
              params: [contractAddress, "latest"],
              id: 1,
            }),
          });

          const data = (await resp.json()) as any;
          const balanceWei = parseInt(data.result, 16);
          const balanceEth = balanceWei / 1e18;

          return {
            success: true,
            data: {
              chain,
              contract_address: contractAddress,
              metric,
              balance_wei: balanceWei.toString(),
              balance_eth: balanceEth,
              block: "latest",
            },
            source: "onchain_rpc",
            fetched_at: new Date().toISOString(),
          };
        }
      }

      // Get latest block number as a basic connectivity + state check
      const blockResp = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_blockNumber",
          params: [],
          id: 1,
        }),
      });

      const blockData = (await blockResp.json()) as any;
      const blockNumber = parseInt(blockData.result, 16);

      return {
        success: true,
        data: {
          chain,
          metric,
          note: "Generic on-chain query — specific contract calls require ABI encoding",
          latest_block: blockNumber,
          contract_address: contractAddress || "none specified",
        },
        source: "onchain_rpc",
        fetched_at: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        data: {},
        source: "onchain_rpc",
        fetched_at: new Date().toISOString(),
        error: `Fetch failed: ${error}`,
      };
    }
  }
}
