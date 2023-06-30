import BigNumber from "bignumber.js";
import { BigNumber as BigNumberE, providers } from "ethers";
import { provider } from ".";
import { COW_PROTOCOL_TRADE_EVENT, UNISWAP_V2_SWAP_EVENT, UNISWAP_V3_SWAP_EVENT } from "./const";
import { cowProtocol } from "./dexs/cowProtocol";
import { UniswapV2 } from "./dexs/uniswapV2";
import { UniswapV3 } from "./dexs/uniswapV3";
import { getCoWProtocolSettelements, getDex } from "./utils";
import { logger } from "./winstonLogger";

class LiquidityCalculator {
  async getInternalLiquidityOfCoWProtocol(startBlock: number, endBlock: number) {
    const cowTransactions = await getCoWProtocolSettelements(startBlock, endBlock);
    for (const cowTx of cowTransactions) {
      await this.getInternalLiquidityOfCoWProtocolTransaction(cowTx);
    }
  }

  async getInternalLiquidityOfCoWProtocolTransaction(transaction: string) {
    try {
      logger.info(`[CoW Protocol] Calculating internal liqudity for ${transaction}`);

      const transactionReceipt = await provider.getTransactionReceipt(transaction);
      const { totalAmountInByToken, totalAmountOutByToken } = this.getTradeLiquidityOfCoWProtocol(transactionReceipt);

      const totalAmountInDeXByToken = await this.getDeXInLiquidity(transactionReceipt);

      totalAmountOutByToken.forEach((amountOut, tokenOut) => {
        const inAmountTokens = totalAmountInByToken.get(tokenOut) ?? BigNumberE.from(0);
        const dexInAmountTokens = totalAmountInDeXByToken.get(tokenOut) ?? BigNumberE.from(0);

        const _amountIn = new BigNumber(inAmountTokens.toString());
        const _dexAmountIn = new BigNumber(dexInAmountTokens.toString());
        const _amountOut = new BigNumber(amountOut.toString());

        const internalLiquidity = _amountIn.minus(_dexAmountIn).dividedBy(_amountOut);

        logger.info(`[CoW Protocol] Internal Liquidity is ${internalLiquidity.toFixed(2)} for token ${tokenOut}`);
      });
    } catch (err) {
      logger.error(`Error while calculating internal liqudity of tx ${transaction}: ${err}`);
    }
  }

  async getPotentialInternalLiquidtyOfUniswap(fromBlock: number, endBlock: number) {
    for (var blockNumber = fromBlock; blockNumber <= endBlock; blockNumber++) {
      logger.info(`[Uniswap V2] Calculating internal liqudity for block ${blockNumber}`);

      try {
        const totalAmountInByToken = new Map<string, BigNumberE>();
        const totalAmountOutByToken = new Map<string, BigNumberE>();
        const block = await provider.getBlock(blockNumber);

        const transactions = block.transactions;

        for (const transaction of transactions) {
          const transactionReceipt = await provider.getTransactionReceipt(transaction);
          for (const log of transactionReceipt.logs) {
            const logFunctionSelector = log.topics[0];
            if (logFunctionSelector !== UNISWAP_V2_SWAP_EVENT && logFunctionSelector !== UNISWAP_V3_SWAP_EVENT) continue;
            const uniswapDeX = logFunctionSelector === UNISWAP_V2_SWAP_EVENT ? new UniswapV2() : new UniswapV3();

            const { tokenIn, amountIn, tokenOut, amountOut } = await uniswapDeX.getSwapAmounts(log);

            const currentAmountIn = totalAmountInByToken.get(tokenIn);
            const currentAmountOut = totalAmountOutByToken.get(tokenOut);

            currentAmountIn ? totalAmountInByToken.set(tokenIn, currentAmountIn.add(amountIn)) : totalAmountInByToken.set(tokenIn, amountIn);
            currentAmountOut ? totalAmountOutByToken.set(tokenOut, currentAmountOut.add(amountOut)) : totalAmountOutByToken.set(tokenOut, amountOut);
          }
        }

        totalAmountOutByToken.forEach((amountOut, tokenOut) => {
          const amountIn = totalAmountInByToken.get(tokenOut) ?? BigNumberE.from(0);

          const _inAmountTokens = new BigNumber(amountIn.toString());
          const _amountOut = new BigNumber(amountOut.toString());

          const _internalLiquidity = _inAmountTokens.dividedBy(_amountOut);
          logger.info(`[Uniswap V2] Internal Liquidity is ${_internalLiquidity.toFixed(2)} for token ${tokenOut}`);
        });

        return { totalAmountInByToken, totalAmountOutByToken };
      } catch (err) {
        logger.error(`Error while calculating internal liqudity of block ${blockNumber}: ${err}`);
      }
    }
  }

  private getTradeLiquidityOfCoWProtocol(transaction: providers.TransactionReceipt) {
    const totalAmountInByToken = new Map<string, BigNumberE>();
    const totalAmountOutByToken = new Map<string, BigNumberE>();

    for (const log of transaction.logs) {
      if (log.topics[0] !== COW_PROTOCOL_TRADE_EVENT) continue;
      const { amountIn, tokenIn, amountOut, tokenOut } = cowProtocol.getSwapAmounts(log);

      const currentAmountIn = totalAmountInByToken.get(tokenIn);
      const currentAmountOut = totalAmountOutByToken.get(tokenOut);

      currentAmountIn ? totalAmountInByToken.set(tokenIn, currentAmountIn.add(amountIn)) : totalAmountInByToken.set(tokenIn, amountIn);
      currentAmountOut ? totalAmountOutByToken.set(tokenOut, currentAmountOut.add(amountOut)) : totalAmountOutByToken.set(tokenOut, amountOut);
    }

    return { totalAmountInByToken, totalAmountOutByToken };
  }

  private async getDeXInLiquidity(transaction: providers.TransactionReceipt) {
    const totalAmountInByToken = new Map<string, BigNumberE>();

    for (const log of transaction.logs) {
      const logFunctionSelector = log.topics[0];
      const dex = await getDex(logFunctionSelector, log.address);

      if (dex === "NOT IMPLEMENTED") continue;
      const { amountIn, tokenIn } = await dex.getAmountsIn(log);
      const currentAmountIn = totalAmountInByToken.get(tokenIn);

      currentAmountIn ? totalAmountInByToken.set(tokenIn, currentAmountIn.add(amountIn)) : totalAmountInByToken.set(tokenIn, amountIn);
    }

    return totalAmountInByToken;
  }
}

export const liquidityCalculator = new LiquidityCalculator();
