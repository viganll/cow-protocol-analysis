import { DuneClient, QueryParameter } from "@cowprotocol/ts-dune-client";
import BigNumber from "bignumber.js";
import "dotenv/config";
import moment from "moment";
import { PRICES } from "./prices";
import { logger } from "./winstonLogger";

class PriceService {
  private client: DuneClient;

  constructor() {
    this.client = new DuneClient(process.env.DUNE_API_KEY ?? "");
  }

  getPriceDeprecated = async (token: string, timestamp: string): Promise<{ decimals: number | undefined; price: number | undefined }> => {
    const queryID = 2713994;
    const parameters = [QueryParameter.date("timestamp", moment(timestamp).format("YYYY-MM-DD")), QueryParameter.text("contract_address", token)];

    const executionResult = await this.client.refresh(queryID, parameters);
    const rows = executionResult.result?.rows;
    if (rows && rows.length > 0) {
      const { decimals, price } = rows[0] as { price: number; decimals: number };
      logger.info(`${decimals} ${price}`);
      return { decimals, price };
    } else {
      logger.warn(`Couldn't find USD price for ${token} timestamp ${timestamp}`);
      return { decimals: undefined, price: undefined };
    }
  };

  getUSDPrice = (token: string) => {
    const priceFound = PRICES.filter((price) => price.contract_address.toLowerCase() === token.toLowerCase())[0];

    if (!priceFound) {
      logger.warn(`No price found for ${token}`);
      return { price: 0, decimals: 18 };
    }

    return { price: priceFound.price, decimals: priceFound.decimals };
  };

  convertToUSD = (token: string, amount: BigNumber, percentage: number) => {
    const { price, decimals } = this.getUSDPrice(token);

    return amount.multipliedBy(price).dividedBy(Math.pow(10, decimals)).multipliedBy(percentage);
  };
}

export const priceService = new PriceService();
