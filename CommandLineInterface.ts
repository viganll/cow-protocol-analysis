import { Command } from "commander";
import { cowProtocolService } from "./CoWProtocolService";
import { flashbotsBlockService } from "./FlashbotsService";
import { liquidityCalculator } from "./LiquidityCalculator";
import { priceService } from "./PriceService";
import { getCoWProtocolSettelementsWithTx, partitionRange, writeJSONFile } from "./utils";
const program = new Command();

class CommandLineInterface {
  init() {
    program
      .command("calculate-cow-tx <tx>")
      .description("It calculates internal liquidity of tx")
      .action(async (tx) => {
        const cowBatch = await liquidityCalculator.getInternalLiquidityOfCoWProtocolTransaction(tx);
        console.log(cowBatch);
      });

    program
      .command("calculate-cow <startBlock> <endBlock>")
      .description("It calculates internal liquidity of CoW Protocol from startBlock to endBlock")
      .action(async (startBlock, endBlock) => {
        const partitions = partitionRange(parseInt(startBlock), parseInt(endBlock), 10000);

        for await (const { start, end } of partitions) {
          const cowBatches = await liquidityCalculator.getInternalLiquidityOfCoWProtocol(start, end);
          writeJSONFile(`cow_batches/${start}_${end}.json`, cowBatches);
        }
      });

    program
      .command("calculate-no-interaction <startBlock> <endBlock>")
      .description("It calculates no interaction of CoW Protocol from startBlock to endBlock")
      .action(async (startBlock, endBlock) => {
        await liquidityCalculator.getBatchesSettledWithNoInteractions(parseInt(startBlock), parseInt(endBlock));
      });

    program
      .command("calculate-cow-uniswap <startBlock> <endBlock>")
      .description("It calculates internal liquidity of Uniswap V2 from startBlock to endBlock")
      .action(async (startBlock, endBlock) => {
        const partitions = partitionRange(parseInt(startBlock), parseInt(endBlock), 1000);

        for await (const { start, end } of partitions) {
          try {
            const cowBlocks = await liquidityCalculator.getPotentialInternalLiquidtyOfUniswap(start, end);
            writeJSONFile(`cow_blocks/${start}_${end}.json`, cowBlocks);
          } catch (err) {
            // Silent error
          }
        }
      });

    program
      .command("get-submission-duration <startBlock> <endBlock>")
      .description("It calculates the time it took a order to be submitted")
      .action(async (startBlock, endBlock) => {
        await cowProtocolService.getOrderSubmissionDurationWithBlockRange(parseInt(startBlock), parseInt(endBlock));
      });

    program
      .command("batches-via-flashbots <startBlock> <endBlock>")
      .description("It finds the batches that were submitted via Flashbots")
      .action(async (startBlock, endBlock) => {
        const partitions = partitionRange(parseInt(startBlock), parseInt(endBlock), 100);

        for await (const { start, end } of partitions) {
          const batchesInBundles = await flashbotsBlockService.getBatchesSubmittedViaFlashbots(start, end);
          if (batchesInBundles?.length > 0) {
            writeJSONFile(`batches_in_bundles/${start}_${end}.json`, batchesInBundles);
          }
        }
      });

    program
      .command("get-cow-settelements <startBlock> <endBlock>")
      .description("It finds cow settelements")
      .action(async (startBlock, endBlock) => {
        await getCoWProtocolSettelementsWithTx(parseInt(startBlock), parseInt(endBlock));
      });

    program
      .command("get-order-prices <token>")
      .description("It gets the orders prices in USD")
      .action(async (token) => {
        await priceService.getUSDPrice(token);
      });

    program.parse();
  }
}

export const commandLineInterface = new CommandLineInterface();
