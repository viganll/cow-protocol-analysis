import BigNumber from "bignumber.js";
import { Contract } from "ethers";
import fs from "fs";
import moment from "moment";
import { provider } from ".";
import { priceService } from "./PriceService";
import { UNISWAP_V2_ABI } from "./abis";
import {
  BALANCER_SWAP_EVENT,
  COW_PROTOCOL_ADDRESS,
  COW_PROTOCOL_SETTLEMENT_EVENT,
  CURVE_SWAP_EVENT,
  CURVE_TRICRYPTO_EVENT,
  DODO_SWAP_EVENT,
  MAVERICK_SWAP_EVENT,
  PANCAKE_V2_FACTORY_ADDRESS,
  PANCAKE_V2_SWAP_EVENT,
  SUSHISWAP_SWAP_EVENT,
  SUSHISWAP_V2_FACTORY_ADDRESS,
  UNISWAP_V2_FACTORY_ADDRESS,
  UNISWAP_V2_SWAP_EVENT,
  UNISWAP_V3_SWAP_EVENT,
} from "./const";
import { Balancer } from "./dexs/balancer";
import { Curve } from "./dexs/curve";
import { CurveTricrypto } from "./dexs/curveTricrypto";
import { Dodo } from "./dexs/dodo";
import { PancakeV2 } from "./dexs/pancakeV2";
import { Sushiswap } from "./dexs/sushiswap";
import { UniswapV2 } from "./dexs/uniswapV2";
import { UniswapV3 } from "./dexs/uniswapV3";
import { CoWBatch, CoWBlock, TokenOut } from "./types";

export async function getDex(functionSelector: string, address: string) {
  switch (functionSelector) {
    case UNISWAP_V3_SWAP_EVENT:
      return new UniswapV3();
    case BALANCER_SWAP_EVENT:
      return new Balancer();
    case CURVE_SWAP_EVENT:
      return new Curve();
    case CURVE_TRICRYPTO_EVENT:
      return new CurveTricrypto();
    case DODO_SWAP_EVENT:
      return new Dodo();
    case UNISWAP_V2_SWAP_EVENT:
    case SUSHISWAP_SWAP_EVENT:
    case PANCAKE_V2_SWAP_EVENT:
      const contract = new Contract(address, UNISWAP_V2_ABI, provider);
      const factoryAddress = await contract.factory();

      if (factoryAddress === UNISWAP_V2_FACTORY_ADDRESS) {
        return new UniswapV2();
      } else if (factoryAddress === SUSHISWAP_V2_FACTORY_ADDRESS) {
        return new Sushiswap();
      } else if (factoryAddress === PANCAKE_V2_FACTORY_ADDRESS) {
        return new PancakeV2();
      }

      return "NOT_SUPPORTED";
    case PANCAKE_V2_SWAP_EVENT:
      return new PancakeV2();
    case MAVERICK_SWAP_EVENT:
    default:
      return "NOT_SUPPORTED";
  }
}

export async function getCoWProtocolSettelementsWithTx(fromBlock: number, toBlock: number) {
  const filter = {
    address: COW_PROTOCOL_ADDRESS,
    topics: [COW_PROTOCOL_SETTLEMENT_EVENT],
    fromBlock,
    toBlock,
  };

  // Get the transaction history using the filter
  const logs = await provider.getLogs(filter);

  // Fetch the transactions using the transaction hashes from the logs
  return await Promise.all(
    logs.map(async (log) => {
      const transaction = await provider.getTransaction(log.transactionHash);
      return transaction;
    })
  );
}

export async function getUniswapLogs(fromBlock: number, toBlock: number) {
  const filter = {
    topics: [UNISWAP_V3_SWAP_EVENT],
    fromBlock,
    toBlock,
  };

  const logs = await provider.getLogs(filter);
  return logs;
}

export async function getCoWProtocolSettelements(fromBlock: number, toBlock: number) {
  const filter = {
    address: COW_PROTOCOL_ADDRESS,
    topics: [COW_PROTOCOL_SETTLEMENT_EVENT],
    fromBlock,
    toBlock,
  };

  // Get the transaction history using the filter
  const logs = await provider.getLogs(filter);
  return logs.map((log) => log.transactionHash);
}

export function buildTokenOut({ token, cowScore, totalAmount, maxCowScore }: { token: string; cowScore: number; maxCowScore: number; totalAmount: BigNumber }): TokenOut {
  const cowValueInUsd = priceService.convertToUSD(token, totalAmount, cowScore);
  const valueInUsd = priceService.convertToUSD(token, totalAmount, 1);

  const maxCowValueInUsd = cowScore === maxCowScore ? cowValueInUsd : priceService.convertToUSD(token, totalAmount, maxCowScore);

  return {
    token,
    cowScore,
    totalAmount,
    valueInUsd: valueInUsd.toNumber(),
    cowValueInUsd: cowValueInUsd.toNumber(),
    maxCowValueInUsd: maxCowValueInUsd.toNumber(),
  };
}

export function buildCoWBlock({ blockNumber, timestamp, tokensOut }: { blockNumber: number; timestamp: number; tokensOut: TokenOut[] }): CoWBlock {
  const maxCowValueInUsd = tokensOut.reduce((prev, current) => prev + current.maxCowValueInUsd, 0);
  const batchValueInUsd = tokensOut.reduce((prev, current) => prev + current.valueInUsd, 0);
  const maxCowScore = batchValueInUsd !== 0 ? maxCowValueInUsd / batchValueInUsd : 0;

  return {
    maxCowScore,
    maxCowValueInUsd,
    blockNumber,
    batchValueInUsd,
    timestamp: formatDate(timestamp),
    tokensOut,
  };
}

export function buildCoWBatch({
  transaction,
  blockNumber,
  timestamp,
  tokensOut,
  noInteraction,
}: {
  transaction: string;
  blockNumber: number;
  timestamp: number;
  tokensOut: TokenOut[];
  noInteraction: boolean;
}): CoWBatch {
  const cowValueInUsd = tokensOut.reduce((prev, current) => prev + current.cowValueInUsd, 0);
  const maxCowValueInUsd = tokensOut.reduce((prev, current) => prev + current.maxCowValueInUsd, 0);
  const batchValueInUsd = tokensOut.reduce((prev, current) => prev + current.valueInUsd, 0);

  const cowScore = batchValueInUsd !== 0 ? cowValueInUsd / batchValueInUsd : 0;
  const maxCowScore = batchValueInUsd !== 0 ? maxCowValueInUsd / batchValueInUsd : 0;

  return {
    txHash: transaction,
    cowScore,
    maxCowScore,
    blockNumber,
    cowValueInUsd,
    batchValueInUsd,
    noInteraction: noInteraction && cowScore === 0,
    timestamp: formatDate(timestamp),
    tokensOut,
  };
}

export function partitionRange(start: number, end: number, range: number) {
  const ranges: { start: number; end: number }[] = [];

  for (let i = start; i <= end; i += range) {
    const rangeStart = i;
    const rangeEnd = Math.min(i + range - 1, end); // Ensure the last range doesn't exceed the end

    ranges.push({ start: rangeStart, end: rangeEnd });
  }

  return ranges;
}

export function minMax(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function groupByProperty<T extends Record<PropertyKey, any>, K extends keyof T>(array: T[], property: K): Record<T[K], T[]> {
  return array.reduce((result, item) => {
    const key = item[property];
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
    return result;
  }, {} as Record<T[K], T[]>);
}

export function formatDate(timestamp: number) {
  return moment.unix(timestamp).format();
}

export function writeJSONFile(fileName: string, data: any) {
  return fs.writeFileSync(fileName, JSON.stringify(data));
}
