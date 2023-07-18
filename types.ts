import BigNumber from "bignumber.js";

export interface CoWBatch {
  txHash: string;
  cowScore: number;
  maxCowScore: number;
  batchValueInUsd: number;
  cowValueInUsd: number;
  blockNumber: number;
  timestamp: string;
  noInteraction?: boolean;
  tokensOut: TokenOut[];
}

export interface CoWBlock {
  blockNumber: number;
  timestamp: string;
  maxCowScore: number;
  maxCowValueInUsd: number;
  batchValueInUsd: number;
  tokensOut: TokenOut[];
}

export interface TokenOut {
  token: string;
  cowScore: number;
  cowValueInUsd: number;
  maxCowValueInUsd: number;
  totalAmount: BigNumber;
  valueInUsd: number;
}

export interface BatchInBundle {
  blockNumber: number;
  numberOfTransactions: number;
  solverAddress: string;
  batchIndex: number;
}

export interface OrderDuration {
  orderId: string;
  duration: number;
  submitedAt: string;
  minedAt: string;
}
