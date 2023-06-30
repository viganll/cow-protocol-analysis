import { providers } from "ethers";
import { SUSHISWAP_ABI } from "../abis";
import { DeX } from "./dex";

export class Sushiswap extends DeX {
  constructor() {
    super(SUSHISWAP_ABI);
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
    return "Sushiswap V2";
  }
}
