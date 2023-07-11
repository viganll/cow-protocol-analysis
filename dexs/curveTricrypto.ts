import { Contract, providers } from "ethers";
import { provider } from "..";
import { CURVE_TRICRYPTO_ABI } from "../abis";
import { CURVE_TRICRYPTO_ADDRESS } from "../const";
import { DeX } from "./dex";

export class CurveTricrypto extends DeX {
  private contract: Contract;

  constructor() {
    super(CURVE_TRICRYPTO_ABI);
    this.contract = new Contract(CURVE_TRICRYPTO_ADDRESS, CURVE_TRICRYPTO_ABI, provider);
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
    const { sold_id, tokens_sold, bought_id, tokens_bought } = args;
    const tokenOut = await this.contract.coins(bought_id);
    const tokenIn = await this.contract.coins(sold_id);

    return { tokenOut, amountOut: tokens_bought, tokenIn, amountIn: tokens_sold };
  }

  public getName() {
    return "Curve Tricrypto";
  }
}
