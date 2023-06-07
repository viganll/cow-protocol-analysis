import BigNumber from "bignumber.js";
import { BigNumber as BigNumberE, providers } from "ethers";
import { COW_PROTOCOL_TRADE_EVENT } from "./const";
import { cowProtocol } from "./cowProtocol";
import { dex } from "./dex";
import { logger } from "./winstonLogger";

class LiquidityCalculator {
  async calculateLiquidityOfTransaction(
    transaction: providers.TransactionReceipt
  ) {
    const { totalAmountInByToken, totalAmountOutByToken } =
      this.calculateSettlementContractFlowLiquidity(transaction);

    const totalAmountInDeXByToken = await this.calculateDeXInLiquidity(
      transaction
    );

    totalAmountOutByToken.forEach((value, key) => {
      const inAmountTokens =
        totalAmountInByToken.get(key) ?? BigNumberE.from(0);
      const dexInAmountTokens =
        totalAmountInDeXByToken.get(key) ?? BigNumberE.from(0);

      const _inAmountTokens = new BigNumber(inAmountTokens.toString());
      const _dexInAmountTokens = new BigNumber(dexInAmountTokens.toString());
      const _value = new BigNumber(value.toString());

      const _internalLiquidity = _inAmountTokens
        .minus(_dexInAmountTokens)
        .dividedBy(_value);

      // logger.info(`In amount tokens: ${inAmountTokens} token: ${key}`);
      // logger.info(`Dex In amount tokens: ${dexInAmountTokens} token: ${key}`);
      // logger.info(`Out amount tokens: ${value} token: ${key}`);

      logger.info(
        `Internal Liquidity is: ${_internalLiquidity}, Token: ${key}`
      );
    });
  }

  private calculateSettlementContractFlowLiquidity(
    transaction: providers.TransactionReceipt
  ) {
    const totalAmountInByToken = new Map<string, BigNumberE>();
    const totalAmountOutByToken = new Map<string, BigNumberE>();

    for (const log of transaction.logs) {
      debugger;
      if (log.topics[0] !== COW_PROTOCOL_TRADE_EVENT) continue;
      const { inAmount, inToken, outAmount, outToken } =
        cowProtocol.getAmountInAndOutOfTrade(log);

      const currentAmountIn = totalAmountInByToken.get(inToken);
      const currentAmountOut = totalAmountOutByToken.get(outToken);

      currentAmountIn
        ? totalAmountInByToken.set(inToken, currentAmountIn.add(inAmount))
        : totalAmountInByToken.set(inToken, inAmount);
      currentAmountOut
        ? totalAmountOutByToken.set(outToken, currentAmountOut.add(outAmount))
        : totalAmountOutByToken.set(outToken, outAmount);
    }

    return { totalAmountInByToken, totalAmountOutByToken };
  }

  private async calculateDeXInLiquidity(
    transaction: providers.TransactionReceipt
  ) {
    const totalAmountInByToken = new Map<string, BigNumberE>();

    for (const log of transaction.logs) {
      const logFunctionSelector = log.topics[0];
      if (!dex.getAllDeXsSelectors().includes(logFunctionSelector)) continue;

      const { amount, token } = await dex.getAmountsIn(
        logFunctionSelector,
        log
      );

      const currentAmountIn = totalAmountInByToken.get(token);

      currentAmountIn
        ? totalAmountInByToken.set(token, currentAmountIn.add(amount))
        : totalAmountInByToken.set(token, amount);
    }

    return totalAmountInByToken;
  }
}

export const liquidityCalculator = new LiquidityCalculator();
