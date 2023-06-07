import { providers } from "ethers";
import { liquidityCalculator } from "./LiquidityCalculator";
const INFURA_RPC_URL =
  "https://mainnet.infura.io/v3/6cae6c56511b4bfa82afea21b80bd640";

export const provider = new providers.StaticJsonRpcProvider(INFURA_RPC_URL);

//0x4769c7e1bfc28fa2b0648cd450b90c6ae0c73664b9c398a408560cc997981700
//0x24c3dbca7c683eeaa4840ffcc21d0a154879cbabb73c58c594790230047e8a96
//0x94f4d7bc956119669494cd27bd21d08dd64385c8cd04227006fd3db754be8b3a
//0x75cdb1aafb3197be225db4b03ed96142261a8c10e48d21b9ae12bec22260cb92
//0xafa673aa5711cdf2bdf31de1a196c754bbee15de9324551ed22ca859c8b77638
//0x6448bb481b6dfe85ad58bba6cc9995755582209a3f51155ba634b1427b3d49e5
//0x974a7205102b145599b36324134cccb1a7c1c37d8f49796f1398f205dd8b0895
//0x7b5ea9d37f9aa3d797471d0e0f2c9e07a034ab96ae49347c280c581e6611d58b
//0x9f0bb91b34770069ce9127e8fdea319e8e7e7eeb136df1c32b96389bde020f32 curve
// 0xfb07964f2a678c3c462de810afc4330462ebfb92a179e566d338e0bd839f5421 pancake v2

async function main() {
  const transaction = await provider.getTransactionReceipt(
    "0x425173346659e23934fc280cce407df8fb3373cef58c341a248a71623e78dc76"
  );

  await liquidityCalculator.calculateLiquidityOfTransaction(transaction);
}

main();
