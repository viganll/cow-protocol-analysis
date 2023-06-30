import { providers } from "ethers";
import { PANCAKE_V2_ABI } from "../abis";
import { DeX } from "./dex";

export class PancakeV2 extends DeX {
  constructor() {
    super(PANCAKE_V2_ABI);
  }

  public async getAmountsIn(log: providers.Log) {
    const { tokenIn, amountIn } = await this.getSwapAmountsUniswapV2Clones(log);
    return { tokenIn, amountIn };
  }

  public async getAmountsOut(log: providers.Log) {
    const { tokenOut, amountOut } = await this.getSwapAmountsUniswapV2Clones(log);
    return { tokenOut, amountOut };
  }

  public getName() {
    return "Pancake V2";
  }
}
