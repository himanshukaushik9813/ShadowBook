import deployment from './deployment.json';

const envAddress = process.env.NEXT_PUBLIC_SHADOWBOOK_ADDRESS;
const envChainId = process.env.NEXT_PUBLIC_SHADOWBOOK_CHAIN_ID;

export const SHADOWBOOK_ADDRESS =
  (envAddress && envAddress.length > 0 ? envAddress : deployment.address);

export const SHADOWBOOK_CHAIN_ID = Number(
  envChainId && envChainId.length > 0 ? envChainId : deployment.chainId
);

export const IS_DEPLOYED =
  SHADOWBOOK_ADDRESS &&
  SHADOWBOOK_ADDRESS !== '0x0000000000000000000000000000000000000000';

export const SUPPORTED_CHAIN_IDS = [11155111, 421614];
