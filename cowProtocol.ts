import { BigNumber, providers, utils } from "ethers";
import { COW_PROTOCOL_ABI } from "./abis";

class CoWProtocol {
  private cowProtocolInterface;

  constructor() {
    this.cowProtocolInterface = new utils.Interface(COW_PROTOCOL_ABI);
  }

  getAmountInAndOutOfTrade(log: providers.Log): {
    inAmount: BigNumber;
    outAmount: BigNumber;
    inToken: string;
    outToken: string;
  } {
    const logDescription = this.cowProtocolInterface.parseLog({
      data: log.data,
      topics: log.topics,
    });

    const { sellToken, buyToken, sellAmount, buyAmount } = logDescription.args;
    return {
      inAmount: sellAmount,
      inToken: sellToken,
      outAmount: buyAmount,
      outToken: buyToken,
    };
  }
}

export const cowProtocol = new CoWProtocol();
