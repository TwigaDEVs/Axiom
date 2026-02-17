import { CronCapability, handler, HTTPClient, NodeRuntime, Runner, type Runtime } from "@chainlink/cre-sdk";
import {TEST_MARKETS} from "./test_markets"
import  {ClassificationPipeline} from "./pipipline_markets"
import { Config, PipelineResult } from "./types";



type MyResult = {
  results: PipelineResult[]
}

const onCronTrigger = (runtime: Runtime<Config>): string => {
  const pipeline = new ClassificationPipeline(runtime);
  const results = pipeline.processMarkets(TEST_MARKETS);
  return JSON.stringify({ results });
};



const initWorkflow = (config: Config) => {
  const cron = new CronCapability();

  return [
    handler(
      cron.trigger(
        { schedule: config.schedule }
      ), 
      onCronTrigger
    ),
  ];
};

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}
