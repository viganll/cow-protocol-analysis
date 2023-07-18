import axios, { AxiosInstance } from "axios";
import { BatchInBundle } from "./types";
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
      const flashbotsBlocks = await flashbotsBlockService.getFlashbotsBlocks(fromBlock, endBlock);

      let numberOfBatches = 0;
      let numberOfBatchesIncludedInBundles = 0;
      let batchesInBundles: BatchInBundle[] = [];

      for await (const cowSettelment of cowSettelments) {
        numberOfBatches++;
        try {
          if (cowSettelment.blockNumber) {
            const flashbotsBundles = flashbotsBlockService.getFlashbotsBundles(flashbotsBlocks, cowSettelment.blockNumber);
            if (flashbotsBundles.length === 0) {
              continue;
            }

            for (const flashbotBundle of flashbotsBundles[0]) {
              if (flashbotBundle.includes(cowSettelment.hash)) {
                batchesInBundles.push({
                  blockNumber: cowSettelment.blockNumber,
                  numberOfTransactions: flashbotBundle.length,
                  solverAddress: cowSettelment.from,
                  batchIndex: flashbotBundle?.indexOf(cowSettelment.hash) ?? -1,
                });
                logger.info(`Bundle contains batch ${cowSettelment.hash}. Solver address: ${cowSettelment.from}. Block number: ${cowSettelment.blockNumber}`);
                numberOfBatchesIncludedInBundles++;

                if (flashbotBundle.length === 1) logger.info("Bundle contains only the batch");
              }
            }
          }
        } catch (err) {
          logger.error(`Error occurred while checking whether the batch was submitted via CoW Protocol for tx ${cowSettelment.hash}: ${err}`);
        }
      }

      logger.info(
        `Total batches: ${numberOfBatches}. Number of batches included in bundles: ${numberOfBatchesIncludedInBundles}. Percentage :${(
          numberOfBatchesIncludedInBundles / numberOfBatches
        ).toFixed(2)}`
      );

      return batchesInBundles;
    } catch (err) {
      logger.error(`Error occurred in getBatchesSubmittedViaFlashbots: ${err}`);
      throw err;
    }
  };

  /*
    @endBlock - is inclusive
  */
  getFlashbotsBlocks = async (startBlock: number, endBlock: number) => {
    try {
      const limit = Math.min(endBlock - startBlock + 1, 100);
      const response = await this.axios.get(`blocks?before=${endBlock + 1}&limit=${limit}`);
      return response.data.blocks as FlashbotsBlock[];
    } catch (err) {
      logger.error(err);
      throw err;
    }
  };

  getFlashbotsBundles = (flashbotsBlocks: FlashbotsBlock[], blockNumber: number) => {
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

    return flashbotsBlocks.filter((fb) => fb.block_number === blockNumber).map((block) => getSubBundles(block.transactions));
  };
}

export const flashbotsBlockService = new FlashbotsBlockService();
