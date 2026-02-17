import {
  CronCapability,
  HTTPClient,
  EVMClient, // New capability
  handler,
  consensusMedianAggregation,
  Runner,
  getNetwork, // Helper for chain selectors
  encodeCallMsg,
  bytesToHex,
  LAST_FINALIZED_BLOCK_NUMBER,
  type NodeRuntime,
  type Runtime,
  hexToBase64,
} from "@chainlink/cre-sdk";
import {
  encodeFunctionData,
  decodeFunctionResult,
  zeroAddress,
  encodeAbiParameters,
  parseAbiParameters,
} from "viem";
import { Registry } from "../contracts/abi/Registry"; // Import your ABI

type EvmConfig = { registryAddress: string; chainName: string };
type Config = { schedule: string; btcApiUrl: string; evms: EvmConfig[] };

const fetchBtcData = (nodeRuntime: NodeRuntime<Config>): bigint => {
  const httpClient = new HTTPClient();

  const req = {
    url: nodeRuntime.config.btcApiUrl,
    method: "GET" as const,
  };

  // Fetching raw UTXO data from the Bitcoin indexer
  const resp = httpClient.sendRequest(nodeRuntime, req).result();

  // For Part 2, let's just count how many UTXOs (unspent outputs) you have
  const utxos = JSON.parse(new TextDecoder().decode(resp.body));
  return BigInt(utxos.length);
};

const onCronTrigger = (runtime: Runtime<Config>) => {
  // 1. Fetch Bitcoin Data (Offchain)
  const utxoCount = runtime
    .runInNodeMode(fetchBtcData, consensusMedianAggregation())()
    .result();
  runtime.log(`BTC UTXO Count: ${utxoCount}`);

  // 2. Setup EVM Client (Onchain)
  const evmConfig = runtime.config.evms[0];
  const network = getNetwork({
    chainFamily: "evm",
    chainSelectorName: evmConfig.chainName,
    isTestnet: true,
  });

  const evmClient = new EVMClient(network.chainSelector.selector);

  // 3. Read from Smart Contract
  const callData = encodeFunctionData({ abi: Registry, functionName: "get" });
  const contractCall = evmClient
    .callContract(runtime, {
      call: encodeCallMsg({
        from: zeroAddress,
        to: evmConfig.registryAddress as `0x${string}`,
        data: callData,
      }),
      blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
    })
    .result();

  const currentOnchainValue = decodeFunctionResult({
    abi: Registry,
    functionName: "get",
    data: bytesToHex(contractCall.data),
  }) as bigint;

  runtime.log(`Successfully read onchain value: ${currentOnchainValue}`);

  const encodedData = encodeAbiParameters(
    parseAbiParameters(
      "uint256 offchainValue, int256 onchainValue, uint256 finalResult",
    ),
    [utxoCount, 0n, utxoCount], // We'll just pass your BTC count as the offchain value
  );

  const report = runtime
    .report({
      encodedPayload: hexToBase64(encodedData),
      encoderName: "evm",
      signingAlgo: "ecdsa",
      hashingAlgo: "keccak256",
    })
    .result();

  runtime.log("Report generated and signed by the DON!");

  const writeResult = evmClient
    .writeReport(runtime, {
      receiver: "0x95e10BaC2B89aB4D8508ccEC3f08494FcB3D23cb", // Tutorial Consumer Address
      report: report,
    })
    .result();

  const txHash = bytesToHex(writeResult.txHash);
  runtime.log(`Success! Transaction submitted: ${txHash}`);

  return { utxoCount, txHash };
};

const initWorkflow = (config: Config) => {
  const cron = new CronCapability();
  return [handler(cron.trigger({ schedule: config.schedule }), onCronTrigger)];
};

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}
