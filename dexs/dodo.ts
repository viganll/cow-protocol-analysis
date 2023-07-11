import { providers } from "ethers";
import { DODO_ABI } from "../abis";
import { DeX } from "./dex";

export class Dodo extends DeX {
  constructor() {
    super(DODO_ABI);
  }

  public async getAmountsIn(log: providers.Log) {
    const { tokenIn, amountIn } = this.getSwapAmounts(log);
    return { tokenIn, amountIn };
  }

  public async getAmountsOut(log: providers.Log) {
    const { tokenOut, amountOut } = this.getSwapAmounts(log);
    return { tokenOut, amountOut };
  }

  public getSwapAmounts(log: providers.Log) {
    const { args } = this.parseLog(log);
    const { fromToken, toToken, fromAmount, toAmount } = args;
    return { tokenOut: toToken, amountOut: toAmount, tokenIn: fromToken, amountIn: fromAmount };
  }

  public getName() {
    return "Dodo";
  }
}
