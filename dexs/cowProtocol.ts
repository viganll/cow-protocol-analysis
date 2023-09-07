import { providers } from "ethers";
import { COW_PROTOCOL_ABI } from "../abis";
import { DeX } from "./dex";

class CoWProtocol extends DeX {
  constructor() {
    super(COW_PROTOCOL_ABI);
  }

  public async getAmountsIn(log: providers.Log) {
    const { tokenIn, amountIn } = await this.getSwapAmounts(log);
    return { tokenIn, amountIn };
  }

  public async getAmountsOut(log: providers.Log) {
    const { tokenOut, amountOut } = await this.getSwapAmounts(log);
    return { tokenOut, amountOut };
  }

  getSwapAmounts(log: providers.Log) {
    //@ts-ignore
    const logDescription = this.parseLog(log);

    const { sellToken, buyToken, sellAmount, buyAmount, feeAmount } = logDescription.args;

    return {
      amountIn: sellAmount,
      tokenIn: sellToken,
      amountOut: buyAmount,
      tokenOut: buyToken,
      feeAmount: feeAmount,
    };
  }

  public getName() {
    return "CoW Protocol";
  }
}

export const cowProtocol = new CoWProtocol();
