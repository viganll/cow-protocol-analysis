import { utils } from "ethers";

export const COW_PROTOCOL_TRADE_EVENT = utils.id("Trade(address,address,address,uint256,uint256,uint256,bytes)");

export const COW_PROTOCOL_SETTLEMENT_EVENT = utils.id("Settlement(address)");

export const UNISWAP_V2_SWAP_EVENT = utils.id("Swap(address,uint256,uint256,uint256,uint256,address)");

export const UNISWAP_V3_SWAP_EVENT = utils.id("Swap(address,address,int256,int256,uint160,uint128,int24)");

export const SUSHISWAP_SWAP_EVENT = utils.id("Swap(address,uint256,uint256,uint256,uint256,address)");

export const MAVERICK_SWAP_EVENT = utils.id("Swap(address,address,bool,bool,uint256,uint256,int32)");

export const BALANCER_SWAP_EVENT = utils.id("Swap(bytes32,address,address,uint256,uint256)");

export const CURVE_SWAP_EVENT = utils.id("TokenExchange(address,uint256,uint256,uint256,uint256)");

export const PANCAKE_V2_SWAP_EVENT = utils.id("Swap(address,uint256,uint256,uint256,uint256,address)");

export const COW_PROTOCOL_ADDRESS = "0x9008D19f58AAbD9eD0D60971565AA8510560ab41";

export const UNISWAP_V2_FACTORY_ADDRESS = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";

export const SUSHISWAP_V2_FACTORY_ADDRESS = "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac";

export const PANCAKE_V2_FACTORY_ADDRESS = "0x1097053Fd2ea711dad45caCcc45EfF7548fCB362";
