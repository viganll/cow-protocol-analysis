import { BigNumber, Contract, providers, utils } from "ethers";
import { provider } from ".";
import {
  BALANCER_ABI,
  CURVE_ABI,
  PANCAKE_V2_ABI,
  SUSHISWAP_ABI,
  UNISWAP_V2_ABI,
  UNISWAP_V3_ABI,
} from "./abis";
import {
  BALANCER_SWAP_EVENT,
  CURVE_SWAP_EVENT,
  MAVERICK_SWAP_EVENT,
  PANCAKE_V2_SWAP_EVENT,
  SUSHISWAP_SWAP_EVENT,
  UNISWAP_V2_SWAP_EVENT,
  UNISWAP_V3_SWAP_EVENT,
} from "./const";

class DeX {
  private uniswapV2Interface: utils.Interface;
  private uniswapV3Interface: utils.Interface;
  private sushiswapInterface: utils.Interface;
  private maverickInterface: utils.Interface;
  private curveInterface: utils.Interface;
  private balancerInterface: utils.Interface;
  private pancakeV2Interface: utils.Interface;

  constructor() {
    this.uniswapV2Interface = new utils.Interface(UNISWAP_V2_ABI);
    this.uniswapV3Interface = new utils.Interface(UNISWAP_V3_ABI);
    this.sushiswapInterface = new utils.Interface(SUSHISWAP_ABI);
    this.maverickInterface = new utils.Interface(UNISWAP_V2_ABI);
    this.curveInterface = new utils.Interface(CURVE_ABI);
    this.balancerInterface = new utils.Interface(BALANCER_ABI);
    this.pancakeV2Interface = new utils.Interface(PANCAKE_V2_ABI);
  }

  getAllDeXsSelectors() {
    return [
      UNISWAP_V2_SWAP_EVENT,
      UNISWAP_V3_SWAP_EVENT,
      SUSHISWAP_SWAP_EVENT,
      MAVERICK_SWAP_EVENT,
      BALANCER_SWAP_EVENT,
      CURVE_SWAP_EVENT,
      PANCAKE_V2_SWAP_EVENT,
    ];
  }

  async getAmountsIn(
    functionSelector: string,
    log: providers.Log
  ): Promise<{ token: string; amount: BigNumber }> {
    const logDescription = this.getInterface(functionSelector).parseLog({
      data: log.data,
      topics: log.topics,
    });

    switch (functionSelector) {
      case UNISWAP_V2_SWAP_EVENT:
        return await this.getAmountsInUniswapV2(
          log.address,
          logDescription.args
        );
      case SUSHISWAP_SWAP_EVENT:
        return await this.getAmountInSushiswap(
          log.address,
          logDescription.args
        );
      case UNISWAP_V3_SWAP_EVENT:
        return await this.getAmountsInUniswapV3(
          log.address,
          logDescription.args
        );
      case BALANCER_SWAP_EVENT:
        return this.getAmountsInBalancer(logDescription.args);
      case CURVE_SWAP_EVENT:
        return await this.getAmountInCurve(log.address, logDescription.args);
      case PANCAKE_V2_SWAP_EVENT:
        return await this.getAmountInPankcakeSwapV2(
          log.address,
          logDescription.args
        );
      case MAVERICK_SWAP_EVENT:
      default:
        return this.getAmountsInUniswapV2(log.address, logDescription.args);
    }
  }

  private async getAmountsInUniswapV2(logAddress: string, args: utils.Result) {
    const { amount0In, amount1In } = args;

    const contract = new Contract(logAddress, UNISWAP_V2_ABI, provider);
    const token0 = await contract.token0();
    const token1 = await contract.token1();

    return amount0In > 0
      ? { token: token0, amount: amount0In }
      : { token: token1, amount: amount1In };
  }

  private async getAmountsInUniswapV3(logAddress: string, args: utils.Result) {
    const { amount0, amount1 } = args;

    const contract = new Contract(logAddress, UNISWAP_V3_ABI, provider);
    const token0 = await contract.token0();
    const token1 = await contract.token1();

    return amount0 > 0
      ? { token: token0, amount: amount0 }
      : { token: token1, amount: amount1 };
  }

  private getAmountsInBalancer(args: utils.Result) {
    const { tokenIn, amountIn } = args;
    return { token: tokenIn, amount: amountIn };
  }

  private async getAmountInSushiswap(logAddress: string, args: utils.Result) {
    const { amount0In, amount1In } = args;

    const contract = new Contract(logAddress, SUSHISWAP_ABI, provider);
    const token0 = await contract.token0();
    const token1 = await contract.token1();

    return amount0In > 0
      ? { token: token0, amount: amount0In }
      : { token: token1, amount: amount1In };
  }

  private async getAmountInCurve(logAddress: string, args: utils.Result) {
    const { tokens_sold, sold_id } = args;

    const contract = new Contract(logAddress, CURVE_ABI, provider);
    const token = await contract.coins(sold_id);

    return { token, amount: tokens_sold };
  }

  private async getAmountInPankcakeSwapV2(
    logAddress: string,
    args: utils.Result
  ) {
    const { amount0In, amount1In } = args;

    const contract = new Contract(logAddress, PANCAKE_V2_ABI, provider);
    const token0 = await contract.token0();
    const token1 = await contract.token1();

    return amount0In > 0
      ? { token: token0, amount: amount0In }
      : { token: token1, amount: amount1In };
  }

  private getInterface(functionSelector: string): utils.Interface {
    switch (functionSelector) {
      case SUSHISWAP_SWAP_EVENT:
        return this.sushiswapInterface;
      case UNISWAP_V2_SWAP_EVENT:
        return this.uniswapV2Interface;
      case UNISWAP_V3_SWAP_EVENT:
        return this.uniswapV3Interface;
      case BALANCER_SWAP_EVENT:
        return this.balancerInterface;
      case CURVE_SWAP_EVENT:
        return this.curveInterface;
      case PANCAKE_V2_SWAP_EVENT:
        return this.pancakeV2Interface;
      case MAVERICK_SWAP_EVENT:
      default:
        return this.uniswapV2Interface;
    }
  }
}

export const dex = new DeX();
