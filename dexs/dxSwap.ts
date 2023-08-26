import { providers } from "ethers";
import { UNISWAP_V2_ABI } from "../abis";
import { DeX } from "./dex";

export class DXswap extends DeX {
  constructor() {
    super(UNISWAP_V2_ABI);
  }

  public async getAmountsIn(log: providers.Log) {
    const { tokenIn, amountIn } = await this.getSwapAmountsUniswapV2Clones(log);
    return { tokenIn, amountIn };
  }

  public async getAmountsOut(log: providers.Log) {
    const { tokenOut, amountOut } = await this.getSwapAmountsUniswapV2Clones(log);
    return { tokenOut, amountOut };
  }

  public async getSwapAmounts(log: providers.Log) {
    const { tokenOut, amountOut, tokenIn, amountIn } = await this.getSwapAmountsUniswapV2Clones(log);
    return { tokenOut, amountOut, tokenIn, amountIn };
  }

  public getName() {
    return "DXswap";
  }
}
