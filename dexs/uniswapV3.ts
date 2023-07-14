import { BigNumber, Contract, providers } from "ethers";
import { provider } from "../.";
import { UNISWAP_V3_ABI } from "../abis";
import { DeX } from "./dex";

export class UniswapV3 extends DeX {
  constructor() {
    super(UNISWAP_V3_ABI);
  }

  public async getAmountsIn(log: providers.Log) {
    const { tokenIn, amountIn } = await this.getSwapAmounts(log);
    return { tokenIn, amountIn };
  }

  public async getAmountsOut(log: providers.Log) {
    const { tokenOut, amountOut } = await this.getSwapAmounts(log);
    return { tokenOut, amountOut };
  }

  public async getSwapAmounts(log: providers.Log) {
    const { args } = this.parseLog(log);

    const { amount0, amount1 } = args;

    const contract = new Contract(log.address, UNISWAP_V3_ABI, provider);
    const token0 = await contract.token0();
    const token1 = await contract.token1();

    return amount0 > 0
      ? { tokenIn: token0, amountIn: amount0, tokenOut: token1, amountOut: BigNumber.from(amount1).mul(-1) }
      : { tokenIn: token1, amountIn: amount1, tokenOut: token0, amountOut: BigNumber.from(amount0).mul(-1) };
  }

  public getName() {
    return "Uniswap V3";
  }
}
