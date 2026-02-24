export enum Outcome {
  Unresolved = 0,
  Yes = 1,
  No = 2,
  Undetermined = 3,
}

export enum SettlementAction {
  Settle = 0,
  Defer = 1,
  Escalate = 2,
  Reject = 3,
}

export enum MarketCategory {
  CategoryA = 0,
  CategoryB = 1,
  CategoryC = 2,
  Malformed = 3,
}

export interface ResolutionData {
  category: number;
  confidence: number;
  action: number;
  reasoning: string;
  evaluationSummary: string;
  sourcesConsulted: number;
  resolvedAt: string;
}

export interface MarketData {
  question: string;
  resolutionCriteria: string;
  deadline: bigint;
  metadataURI: string;
  resolved: boolean;
  result: number;
  resolution: ResolutionData;
}

export interface MarketEntry {
  marketId: string;
  market: MarketData;
}
