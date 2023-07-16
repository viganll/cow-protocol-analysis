import { BigNumber, Contract, providers, utils } from "ethers";
import { provider } from "../";
import { BALANCER_ABI, CURVE_ABI, CURVE_TRICRYPTO_ABI, DODO_ABI, UNISWAP_V2_ABI, UNISWAP_V3_ABI } from "../abis";

export type Abi = typeof UNISWAP_V2_ABI | typeof BALANCER_ABI | typeof UNISWAP_V3_ABI | typeof CURVE_ABI | typeof DODO_ABI | typeof CURVE_TRICRYPTO_ABI;

interface DeXInterface {
  getAmountsIn(log: providers.Log): Promise<{
    tokenIn: string;
    amountIn: BigNumber;
  }>;

  getAmountsOut(log: providers.Log): Promise<{
    tokenOut: string;
    amountOut: BigNumber;
  }>;
  getName(): string;
}

export abstract class DeX implements DeXInterface {
  private interface: utils.Interface;
  private abi: Abi;

  constructor(abi: Abi) {
    this.abi = abi;
    this.interface = new utils.Interface(abi);
  }

  public getInterface() {
    return this.interface;
  }

  public getAbi() {
    return this.abi;
  }

  abstract getAmountsIn(log: providers.Log): Promise<{
    amountIn: BigNumber;
    tokenIn: string;
  }>;

  abstract getAmountsOut(log: providers.Log): Promise<{
    amountOut: BigNumber;
    tokenOut: string;
  }>;

  abstract getName(): string;

  public parseLog(log: providers.Log) {
    return this.interface.parseLog({
      data: log.data,
      topics: log.topics,
    });
  }

  protected async getSwapAmountsUniswapV2Clones(log: providers.Log) {
    const { args } = this.parseLog(log);
    const { amount0In, amount1In, amount0Out, amount1Out } = args;

    const contract = new Contract(log.address, this.abi, provider);
    const token0 = await contract.token0();
    const token1 = await contract.token1();

    return amount0In > amount1In
      ? {
          tokenIn: token0,
          amountIn: amount0In,
          tokenOut: token1,
          amountOut: amount1Out,
        }
      : {
          tokenIn: token1,
          amountIn: amount1In,
          tokenOut: token0,
          amountOut: amount0Out,
        };
  }
}
