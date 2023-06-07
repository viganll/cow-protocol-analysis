import { utils } from "ethers";

export const COW_PROTOCOL_TRADE_EVENT = utils.id(
  "Trade(address,address,address,uint256,uint256,uint256,bytes)"
);

export const UNISWAP_V2_SWAP_EVENT = utils.id(
  "Swap(address,uint256,uint256,uint256,uint256,address)"
);

export const UNISWAP_V3_SWAP_EVENT = utils.id(
  "Swap(address,address,int256,int256,uint160,uint128,int24)"
);

export const SUSHISWAP_SWAP_EVENT = utils.id(
  "Swap(address,uint256,uint256,uint256,uint256,address)"
);

export const MAVERICK_SWAP_EVENT = utils.id(
  "Swap(address,address,bool,bool,uint256,uint256,int32)"
);

export const BALANCER_SWAP_EVENT = utils.id(
  "Swap(bytes32,address,address,uint256,uint256)"
);

export const CURVE_SWAP_EVENT = utils.id(
  "TokenExchange(address,uint256,uint256,uint256,uint256)"
);

export const PANCAKE_V2_SWAP_EVENT = utils.id(
  "Swap(address,uint256,uint256,uint256,uint256,address)"
);
