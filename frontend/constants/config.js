import deployment from './deployment.json';
import { FHENIX_HELIUM_CHAIN_ID } from './network';

export const SCALING_FACTOR = 1e6;

const envContractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const envShadowUSDCAddress = process.env.NEXT_PUBLIC_SHADOW_USDC_ADDRESS;
const envShadowETHAddress = process.env.NEXT_PUBLIC_SHADOW_ETH_ADDRESS;
const envChainId = process.env.NEXT_PUBLIC_CHAIN_ID;

export const SHADOWBOOK_ADDRESS =
  (envContractAddress && envContractAddress.length > 0
    ? envContractAddress
    : deployment.contractAddress || deployment.address || '');

export const SHADOW_USDC_ADDRESS =
  (envShadowUSDCAddress && envShadowUSDCAddress.length > 0
    ? envShadowUSDCAddress
    : deployment.shadowUSDCAddress || '');

export const SHADOW_ETH_ADDRESS =
  (envShadowETHAddress && envShadowETHAddress.length > 0
    ? envShadowETHAddress
    : deployment.shadowETHAddress || '');

export const SHADOWBOOK_CHAIN_ID = Number(
  envChainId && envChainId.length > 0
    ? envChainId
    : deployment.chainId || FHENIX_HELIUM_CHAIN_ID
);

export const contractAddress = SHADOWBOOK_ADDRESS;
export const shadowUSDCAddress = SHADOW_USDC_ADDRESS;
export const shadowETHAddress = SHADOW_ETH_ADDRESS;
export const chainId = SHADOWBOOK_CHAIN_ID;

export const SUPPORTED_CHAIN_IDS = [FHENIX_HELIUM_CHAIN_ID];

export const IS_DEPLOYED =
  Boolean(SHADOWBOOK_ADDRESS) &&
  SHADOWBOOK_ADDRESS !== '0x0000000000000000000000000000000000000000';
