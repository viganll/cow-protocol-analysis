import { BigNumber, providers } from "ethers";
import { CURVE_ABI } from "../abis";
import { DeX } from "./dex";

export class Curve extends DeX {
  constructor() {
    super(CURVE_ABI);
  }

  public async getAmountsIn(log: providers.Log) {
    const { args } = this.parseLog(log);
    const { tokenIn, amountIn } = args;
    return { tokenIn: tokenIn, amountIn: amountIn };
  }

  public async getAmountsOut(log: providers.Log) {
    return { tokenOut: "0", amountOut: BigNumber.from("0") };
  }

  public getName() {
    return "Curve";
  }
}
