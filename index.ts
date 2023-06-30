import "dotenv/config";
import { providers } from "ethers";
import { commandLineInterface } from "./CommandLineInterface";
import { logger } from "./winstonLogger";

const INFURA_RPC_URL = process.env.INFURA_URL;

export const provider = new providers.StaticJsonRpcProvider(INFURA_RPC_URL);

async function main() {
  commandLineInterface.init();
}

try {
  main();
} catch (err) {
  logger.error(err);
}
