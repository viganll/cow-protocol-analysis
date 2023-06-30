import { Command } from "commander";
import { cowProtocolService } from "./CoWProtocolService";
import { flashbotsBlockService } from "./FlashbotsService";
import { liquidityCalculator } from "./LiquidityCalculator";
const program = new Command();

class CommandLineInterface {
  init() {
    program
      .command("calculate-cow-tx <tx>")
      .description("It calculates internal liquidity of tx")
      .action(async (tx) => {
        await liquidityCalculator.getInternalLiquidityOfCoWProtocolTransaction(tx);
      });

    program
      .command("calculate-cow <startBlock> <endBlock>")
      .description("It calculates internal liquidity of CoW Protocol from startBlock to endBlock")
      .action(async (startBlock, endBlock) => {
        await liquidityCalculator.getInternalLiquidityOfCoWProtocol(parseInt(startBlock), parseInt(endBlock));
      });

    program
      .command("calculate-cow-uniswap <startBlock> <endBlock>")
      .description("It calculates internal liquidity of Uniswap V2 from startBlock to endBlock")
      .action(async (startBlock, endBlock) => {
        await liquidityCalculator.getPotentialInternalLiquidtyOfUniswap(parseInt(startBlock), parseInt(endBlock));
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
        await flashbotsBlockService.getBatchesSubmittedViaFlashbots(parseInt(startBlock), parseInt(endBlock));
      });

    program.parse();
  }
}

export const commandLineInterface = new CommandLineInterface();
