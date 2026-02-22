import {
  CronCapability,
  HTTPClient,
  EVMClient,
  handler,
  consensusMedianAggregation,
  Runner,
  type NodeRuntime,
  type Runtime,
  getNetwork,
  LAST_FINALIZED_BLOCK_NUMBER,
  encodeCallMsg,
  bytesToHex,
  hexToBase64,
} from "@chainlink/cre-sdk";
import {
  encodeAbiParameters,
  parseAbiParameters,
  encodeFunctionData,
  decodeFunctionResult,
  zeroAddress,
} from "viem";

import {ResolutionResult} from "./types/index"

// 1. Updated ABI to match YOUR PredictionMarket.sol
const PredictionMarketABI = [
  {
    name: "marketExists",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "", type: "string" }],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

type EvmConfig = {
  chainName: string;
  storageAddress: string;
  calculatorConsumerAddress: string;
  gasLimit: string;
};

type Config = {
  schedule: string;
  apiUrl: string;
  evms: EvmConfig[];
};

// 2. Result type for a Prediction Market
type MyResult = {
  marketId: string;
  outcome: number;
  txHash: string;
};

const initWorkflow = (config: Config) => {
  const cron = new CronCapability();
  return [handler(cron.trigger({ schedule: config.schedule }), onCronTrigger)];
};

const onCronTrigger = (runtime: Runtime<Config>): MyResult => {
  const evmConfig = runtime.config.evms[0];

  const network = getNetwork({
    chainFamily: "evm",
    chainSelectorName: evmConfig.chainName,
    isTestnet: true,
  });

  if (!network) throw new Error(`Unknown chain name: ${evmConfig.chainName}`);

  // Step 1: Fetch offchain data (In this case, an outcome from an API)
  // We'll simulate fetching '1' (Yes) or '2' (No)
  const outcome = Number(
    runtime
      .runInNodeMode(fetchMarketOutcome, consensusMedianAggregation())()
      .result(),
  );
  const marketId = "market-1"; // Usually you'd get this from the API too

  runtime.log(`Successfully fetched outcome for ${marketId}: ${outcome}`);

  // Step 2: Check if market exists on-chain (Read)
  const evmClient = new EVMClient(network.chainSelector.selector);
  const callData = encodeFunctionData({
    abi: PredictionMarketABI,
    functionName: "marketExists",
    args: [marketId],
  });

  const contractCall = evmClient
    .callContract(runtime, {
      call: encodeCallMsg({
        from: zeroAddress,
        to: evmConfig.calculatorConsumerAddress as `0x${string}`,
        data: callData,
      }),
      blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
    })
    .result();

  const exists = decodeFunctionResult({
    abi: PredictionMarketABI,
    functionName: "marketExists",
    data: bytesToHex(contractCall.data),
  });

  runtime.log(`Market ${marketId} exists on-chain: ${exists}`);

  // Step 3: Write the result to your contract
  const txHash = updateMarketResult(
    runtime,
    network.chainSelector.selector,
    evmConfig,
    marketId,
    outcome,
  );

  const finalWorkflowResult: MyResult = { marketId, outcome, txHash };
  return finalWorkflowResult;
};

const fetchMarketOutcome = (nodeRuntime: NodeRuntime<Config>): bigint => {
  console.log("Calling Oracle Engine...");

  const httpClient = new HTTPClient();

//   const bodyStr = JSON.stringify({
//   market: {
//     marketId: "MKT-001",
//     question: "Will BTC be above $90,000 on February 18, 2026 at 00:00 UTC?",
//     resolution_criteria:
//       "Use spot price BTC/USD from Binance at the specified time. Price must be strictly above $90,000.",
//     deadline: "2026-02-18T00:00:00Z",
//     metadata: {},
//   },
// });

    const bodyStr = JSON.stringify({
  market: {
    marketId: "MKT-002",
    question: "Will the Lakers beat the Clippers on February 20, 2026?",
    resolution_criteria: "Official NBA final score. Lakers must win.",
    deadline: "2026-02-21T00:00:00Z",
    metadata: {},
  },
});

  const body = Buffer.from(new TextEncoder().encode(bodyStr)).toString("base64");

  const req = {
    url: "http://localhost:3000/api/resolve",
    method: "POST" as const,
    headers: { "Content-Type": "application/json" },
    body,
  };

  const resp = httpClient.sendRequest(nodeRuntime, req).result();
  const bodyText = new TextDecoder().decode(resp.body);
  const parsed = JSON.parse(bodyText);
  const result = parsed.result;

  console.log("Oracle result:", bodyText);

  if (result.settlement_action !== "SETTLE") {
    throw new Error(
      `Cannot settle: ${result.settlement_action} (confidence: ${result.confidence}) - ${result.reasoning}`
    );
  }

  if (result.outcome === "YES") return 1n;
  if (result.outcome === "NO") return 0n;

  throw new Error(`Unexpected outcome: ${result.outcome}`);
};

// This matches your template's helper function structure
function updateMarketResult(
  runtime: Runtime<Config>,
  chainSelector: bigint,
  evmConfig: EvmConfig,
  marketId: string,
  outcome: number,
): string {
  const evmClient = new EVMClient(chainSelector);

  // CRITICAL: This must match your Solidity: (string, uint8)
  const reportData = encodeAbiParameters(
    parseAbiParameters("string marketId, uint8 outcome"),
    [marketId, outcome],
  );

  const reportResponse = runtime
    .report({
      encodedPayload: hexToBase64(reportData),
      encoderName: "evm",
      signingAlgo: "ecdsa",
      hashingAlgo: "keccak256",
    })
    .result();

  const writeReportResult = evmClient
    .writeReport(runtime, {
      receiver: evmConfig.calculatorConsumerAddress,
      report: reportResponse,
      gasConfig: { gasLimit: evmConfig.gasLimit },
    })
    .result();

  const txHash = bytesToHex(writeReportResult.txHash || new Uint8Array(32));
  runtime.log(`Transaction: ${txHash}`);
  return txHash;
}

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}
