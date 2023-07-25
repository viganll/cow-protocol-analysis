import BigNumber from "bignumber.js";
import { BigNumber as BigNumberE, providers } from "ethers";
import { provider } from ".";
import { COW_PROTOCOL_INTERACTION_EVENT, COW_PROTOCOL_TRADE_EVENT, ETH_ADDRESS, UNISWAP_V3_SWAP_EVENT, WETH_ADDRESS } from "./const";
import { cowProtocol } from "./dexs/cowProtocol";
import { UniswapV3 } from "./dexs/uniswapV3";
import { CoWBatch, CoWBlock, TokenOut } from "./types";
import { buildCoWBatch, buildCoWBlock, buildTokenOut, getCoWProtocolSettelements, getDex, getUniswapLogs, groupByProperty, minMax } from "./utils";
import { logger } from "./winstonLogger";

class LiquidityCalculator {
  async getInternalLiquidityOfCoWProtocol(startBlock: number, endBlock: number) {
    const cowTransactions = await getCoWProtocolSettelements(startBlock, endBlock);
    let cowBatches: CoWBatch[] = [];
    for (const cowTx of cowTransactions) {
      try {
        const cowBatch = await this.getInternalLiquidityOfCoWProtocolTransaction(cowTx);
        cowBatches.push(cowBatch);
      } catch (err) {
        //Silent err
      }
    }

    return cowBatches;
  }

  async getInternalLiquidityOfCoWProtocolTransaction(transaction: string): Promise<CoWBatch> {
    try {
      logger.info(`[CoW Protocol] Calculating internal liqudity for ${transaction}`);

      const transactionReceipt = await provider.getTransactionReceipt(transaction);
      const { totalAmountInByToken, totalAmountOutByToken, numberOfTrades, noInteraction } = this.getTradeLiquidityOfCoWProtocol(transactionReceipt);

      const blockNumber = transactionReceipt.blockNumber;
      const { timestamp } = await provider.getBlock(blockNumber);

      if (numberOfTrades === 1 && !noInteraction) {
        logger.info(`[CoW Protocol] Skipping tx ${transaction} as it has only one token`);
        const [token, amountOut] = totalAmountOutByToken.entries().next().value;
        const tokenOut = buildTokenOut({ token, cowScore: 0, totalAmount: new BigNumber(amountOut.toString()), maxCowScore: 0 });
        return buildCoWBatch({ transaction, blockNumber, timestamp, noInteraction: false, tokensOut: [tokenOut] });
      }

      const totalAmountInDeXByToken = await this.getDeXInLiquidity(transactionReceipt);

      let tokensOut: TokenOut[] = [];

      for await (const [tokenOut, amountOut] of totalAmountOutByToken.entries()) {
        const inAmountTokens = totalAmountInByToken.get(tokenOut) ?? BigNumberE.from(0);
        const dexInAmountTokens = totalAmountInDeXByToken.get(tokenOut) ?? BigNumberE.from(0);

        const _amountIn = new BigNumber(inAmountTokens.toString());
        const _dexAmountIn = new BigNumber(dexInAmountTokens.toString());
        const _amountOut = new BigNumber(amountOut.toString());

        const cowScore = minMax(_amountIn.minus(_dexAmountIn).dividedBy(_amountOut).toNumber(), 0, 1);
        const maxCowScore = minMax(_amountIn.dividedBy(_amountOut).toNumber(), 0, 1);

        const tokenBuild = buildTokenOut({ token: tokenOut, cowScore, totalAmount: _amountOut, maxCowScore });
        tokensOut.push(tokenBuild);
        logger.info(`[CoW Protocol] Internal Liquidity is ${cowScore.toFixed(2)} for token ${tokenOut}`);
      }

      return buildCoWBatch({ transaction, timestamp, blockNumber, tokensOut, noInteraction });
    } catch (err) {
      logger.error(`Error while calculating internal liqudity of tx ${transaction}: ${err}`);
      throw err;
    }
  }

  async getPotentialInternalLiquidtyOfUniswap(fromBlock: number, endBlock: number) {
    let cowBlocks: CoWBlock[] = [];

    try {
      const logs = await getUniswapLogs(fromBlock, endBlock);
      const logsByBlock = groupByProperty(logs, "blockNumber");

      for await (const [block, logs] of Object.entries(logsByBlock)) {
        const totalAmountInByToken = new Map<string, BigNumberE>();
        const totalAmountOutByToken = new Map<string, BigNumberE>();
        const blockNumber = Number(block);
        const { timestamp } = await provider.getBlock(blockNumber);

        for await (const log of logs) {
          const logFunctionSelector = log.topics[0];
          if (logFunctionSelector !== UNISWAP_V3_SWAP_EVENT) continue;
          const uniswapDeX = new UniswapV3();

          const { tokenIn, amountIn, tokenOut, amountOut } = await uniswapDeX.getSwapAmounts(log);

          const currentAmountIn = totalAmountInByToken.get(tokenIn);
          const currentAmountOut = totalAmountOutByToken.get(tokenOut);

          currentAmountIn ? totalAmountInByToken.set(tokenIn, currentAmountIn.add(amountIn)) : totalAmountInByToken.set(tokenIn, amountIn);
          currentAmountOut ? totalAmountOutByToken.set(tokenOut, currentAmountOut.add(amountOut)) : totalAmountOutByToken.set(tokenOut, amountOut);
        }

        let tokensOut: TokenOut[] = [];

        totalAmountOutByToken.forEach((amountOut, tokenOut) => {
          const amountIn = totalAmountInByToken.get(tokenOut) ?? BigNumberE.from(0);

          const _amountIn = new BigNumber(amountIn.toString());
          const _amountOut = new BigNumber(amountOut.toString());

          const maxCowScore = minMax(_amountIn.dividedBy(_amountOut).toNumber(), 0, 1);

          const tokenBuild = buildTokenOut({ token: tokenOut, cowScore: maxCowScore, totalAmount: _amountOut, maxCowScore });
          tokensOut.push(tokenBuild);

          logger.info(`[Uniswap] Internal Liquidity is ${maxCowScore.toFixed(2)} for token ${tokenOut}`);
        });

        cowBlocks.push(buildCoWBlock({ timestamp, blockNumber, tokensOut }));
      }
    } catch (err) {
      logger.error(`[Uniswap] Error while calculating internal liqudity: ${err}`);
      throw err;
    }
    return cowBlocks;
  }

  async getBatchesSettledWithNoInteractions(fromBlock: number, endBlock: number) {
    const cowTransactions = await getCoWProtocolSettelements(fromBlock, endBlock);
    for (const cowTx of cowTransactions) {
      const transactionReceipt = await provider.getTransactionReceipt(cowTx);
      let includesInteractionEvent = false;
      for (const log of transactionReceipt.logs) {
        if (log.topics[0] === COW_PROTOCOL_INTERACTION_EVENT) {
          includesInteractionEvent = true;
        }
      }

      if (!includesInteractionEvent) logger.info(`No interaction event ${cowTx}`);
    }
  }

  private getTradeLiquidityOfCoWProtocol(transaction: providers.TransactionReceipt) {
    const totalAmountInByToken = new Map<string, BigNumberE>();
    const totalAmountOutByToken = new Map<string, BigNumberE>();
    let numberOfTrades = 0;
    let noInteraction = true;

    for (const log of transaction.logs) {
      if (log.topics[0] === COW_PROTOCOL_INTERACTION_EVENT) noInteraction = false;
      if (log.topics[0] !== COW_PROTOCOL_TRADE_EVENT) continue;
      let { amountIn, tokenIn, amountOut, tokenOut } = cowProtocol.getSwapAmounts(log);
      numberOfTrades++;

      // ETH and WETH should be treated the same
      tokenIn = tokenIn === ETH_ADDRESS ? WETH_ADDRESS : tokenIn;
      tokenOut = tokenOut === ETH_ADDRESS ? WETH_ADDRESS : tokenOut;

      const currentAmountIn = totalAmountInByToken.get(tokenIn);
      const currentAmountOut = totalAmountOutByToken.get(tokenOut);

      currentAmountIn ? totalAmountInByToken.set(tokenIn, currentAmountIn.add(amountIn)) : totalAmountInByToken.set(tokenIn, amountIn);
      currentAmountOut ? totalAmountOutByToken.set(tokenOut, currentAmountOut.add(amountOut)) : totalAmountOutByToken.set(tokenOut, amountOut);
    }

    return { totalAmountInByToken, totalAmountOutByToken, numberOfTrades, noInteraction };
  }

  private async getDeXInLiquidity(transaction: providers.TransactionReceipt) {
    const totalAmountInByToken = new Map<string, BigNumberE>();

    for (const log of transaction.logs) {
      const logFunctionSelector = log.topics[0];
      const dex = await getDex(logFunctionSelector, log.address);
      if (dex === "NOT_SUPPORTED") continue;

      const { amountIn, tokenIn } = await dex.getAmountsIn(log);
      const currentAmountIn = totalAmountInByToken.get(tokenIn);

      currentAmountIn ? totalAmountInByToken.set(tokenIn, currentAmountIn.add(amountIn)) : totalAmountInByToken.set(tokenIn, amountIn);
    }

    return totalAmountInByToken;
  }
}

export const liquidityCalculator = new LiquidityCalculator();
