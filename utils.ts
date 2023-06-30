import { Contract } from "ethers";
import { provider } from ".";
import { UNISWAP_V2_ABI } from "./abis";
import {
  BALANCER_SWAP_EVENT,
  COW_PROTOCOL_ADDRESS,
  COW_PROTOCOL_SETTLEMENT_EVENT,
  CURVE_SWAP_EVENT,
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
import { PancakeV2 } from "./dexs/pancakeV2";
import { Sushiswap } from "./dexs/sushiswap";
import { UniswapV2 } from "./dexs/uniswapV2";
import { UniswapV3 } from "./dexs/uniswapV3";

export async function getDex(functionSelector: string, address: string) {
  switch (functionSelector) {
    case UNISWAP_V3_SWAP_EVENT:
      return new UniswapV3();
    case BALANCER_SWAP_EVENT:
      return new Balancer();
    case CURVE_SWAP_EVENT:
      return new Curve();
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

      return "NOT IMPLEMENTED";
    case PANCAKE_V2_SWAP_EVENT:
      return new PancakeV2();
    case MAVERICK_SWAP_EVENT:
    default:
      return "NOT IMPLEMENTED";
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
