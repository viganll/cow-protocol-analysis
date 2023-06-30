import axios, { AxiosInstance } from "axios";
import { getCoWProtocolSettelementsWithTx } from "./utils";
import { logger } from "./winstonLogger";

interface FlashbotsTransaction {
  transaction_hash: string;
  tx_index: number;
  bundle_type: string;
  bundle_index: number;
  block_number: number;
  eoa_address: string;
  to_address: string;
  gas_used: number;
  gas_price: string;
  coinbase_transfer: string;
  eth_sent_to_fee_recipient: string;
  total_miner_reward: string;
  fee_recipient_eth_diff: string;
}

interface FlashbotsBlock {
  block_number: number;
  miner_reward: string;
  fee_recipient_eth_diff: string;
  miner: string;
  fee_recipient: string;
  coinbase_transfers: string;
  eth_sent_to_fee_recipient: string;
  gas_used: number;
  gas_price: string;
  effective_priority_fee: string;
  transactions: FlashbotsTransaction[];
}

class FlashbotsBlockService {
  private axios: AxiosInstance;
  baseURL = "https://blocks.flashbots.net/v1/";

  constructor() {
    this.axios = axios.create({
      baseURL: this.baseURL,
    });
  }

  getBatchesSubmittedViaFlashbots = async (fromBlock: number, endBlock: number) => {
    try {
      const cowSettelments = await getCoWProtocolSettelementsWithTx(fromBlock, endBlock);

      let includedInBundle = 0;
      let cowSettelmentCount = 0;

      for await (const cowSettelment of cowSettelments) {
        cowSettelmentCount++;
        try {
          if (cowSettelment.blockNumber) {
            const flashbotsBlocks = await flashbotsBlockService.getFlashbotsBundles(cowSettelment.blockNumber);
            if (flashbotsBlocks.length === 0) {
              continue;
            }

            for (const flashbotBundle of flashbotsBlocks[0]) {
              if (flashbotBundle.includes(cowSettelment.hash)) {
                logger.info(`Bundle contains batch ${cowSettelment.hash}. Solver address is: ${cowSettelment.from}`);
                if (flashbotBundle.length === 1) {
                  includedInBundle++;
                  logger.info("Bundle contains only the batch");
                }
              }
            }
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } else {
            logger.info("No block number");
          }
        } catch (err) {
          logger.error(`Error occurred while checking whether the batch was submitted via CoW Protocol for tx ${cowSettelment.hash}: ${err}`);
        }
      }

      logger.info(`Number of bundles included: ${(includedInBundle / cowSettelmentCount).toFixed(2)}`);
    } catch (err) {
      logger.error(`Error occurred in getCoWProtocolSettelements: ${err}`);
    }
  };

  getFlashbotsBlocks = async (blockNumber: number) => {
    try {
      const response = await this.axios.get(`blocks?block_number=${blockNumber}`);
      return response.data.blocks as FlashbotsBlock[];
    } catch (err) {
      throw err;
    }
  };

  getFlashbotsBundles = async (blockNumber: number) => {
    try {
      const blocks = await this.getFlashbotsBlocks(blockNumber);

      function getSubBundles(transactions: FlashbotsTransaction[]) {
        return transactions.reduce((acc: string[][], flashbotTransaction: FlashbotsTransaction) => {
          if (acc[flashbotTransaction.bundle_index]) {
            acc[flashbotTransaction.bundle_index].push(flashbotTransaction.transaction_hash);
          } else {
            acc[flashbotTransaction.bundle_index] = [flashbotTransaction.transaction_hash];
          }
          return acc;
        }, []);
      }

      return blocks.map((block) => getSubBundles(block.transactions));
    } catch (err) {
      throw err;
    }
  };
}

export const flashbotsBlockService = new FlashbotsBlockService();
