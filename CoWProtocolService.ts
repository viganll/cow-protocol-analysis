import axios, { AxiosInstance } from "axios";
import { provider } from ".";
import { COW_PROTOCOL_TRADE_EVENT } from "./const";
import { cowProtocol } from "./dexs/cowProtocol";
import { getCoWProtocolSettelements } from "./utils";
import { logger } from "./winstonLogger";

interface Order {
  sellToken: string;
  buyToken: string;
  receiver: string;
  sellAmount: string;
  buyAmount: string;
  validTo: number;
  appData: string;
  feeAmount: string;
  kind: string;
  partiallyFillable: boolean;
  sellTokenBalance: string;
  buyTokenBalance: string;
  signingScheme: string;
  signature: string;
  from: string;
  quoteId: number;
  creationDate: Date;
  class: string;
  owner: string;
  uid: string;
  executedSellAmount: string;
  executedSellAmountBeforeFees: string;
  executedBuyAmount: string;
  executedFeeAmount: string;
  invalidated: boolean;
  status: string;
  fullFeeAmount: string;
  isLiquidityOrder: boolean;
  onchainUser: string;
  executedSurplusFee: string;
}

class CoWProtocolService {
  private axios: AxiosInstance;
  baseURL = "https://api.cow.fi/mainnet/api/v1/";

  constructor() {
    this.axios = axios.create({
      baseURL: this.baseURL,
    });
  }

  getOrder = async (orderId: string) => {
    try {
      const response = await this.axios.get(`orders/${orderId}`);
      return response.data as Order;
    } catch (err) {
      throw err;
    }
  };

  getOrderSubmissionDurationWithBlockRange = async (fromBlock: number, endBlock: number) => {
    const cowTransactions = await getCoWProtocolSettelements(fromBlock, endBlock);
    for (const cowTx of cowTransactions) {
      await this.getOrderSubmissionDuration(cowTx);
    }
  };

  getOrderSubmissionDuration = async (tx: string) => {
    logger.info(`[CoW Protocol] Getting order submission duration for ${tx}`);

    try {
      const transaction = await provider.getTransactionReceipt(tx);
      for (const log of transaction.logs) {
        if (log.topics[0] !== COW_PROTOCOL_TRADE_EVENT) continue;
        const { args } = cowProtocol.parseLog(log);
        const orderId = args.orderUid;
        const order = await cowProtocolService.getOrder(orderId);
        const block = await provider.getBlock(transaction.blockNumber);
        var blockMinedAt = new Date(0); // The 0 there is the key, which sets the date to the epoch
        blockMinedAt.setUTCSeconds(block.timestamp);
        logger.info(`[CoW Protocol] Order ${orderId} submitted at ${order.creationDate} and mined at ${blockMinedAt}. Duration`);
      }
    } catch (err) {
      logger.error(`Error occurred while getting the order submission duration of ${tx}: ${err}`);
    }
  };
}

export const cowProtocolService = new CoWProtocolService();
