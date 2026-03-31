import { defineChain } from 'viem';

export const FHENIX_HELIUM_CHAIN_ID = 8008135;
export const FHENIX_RPC_URL =
  process.env.NEXT_PUBLIC_FHENIX_RPC_URL || 'https://api.helium.fhenix.zone';
export const FHENIX_EXPLORER_BASE_URL = 'https://explorer.helium.fhenix.zone';

export const fhenixHeliumChain = defineChain({
  id: FHENIX_HELIUM_CHAIN_ID,
  name: 'Fhenix Helium',
  nativeCurrency: {
    name: 'tFHE',
    symbol: 'tFHE',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [FHENIX_RPC_URL] },
    public: { http: [FHENIX_RPC_URL] },
  },
  blockExplorers: {
    default: {
      name: 'Fhenix Explorer',
      url: FHENIX_EXPLORER_BASE_URL,
    },
  },
  testnet: true,
});

export const cofheHeliumChain = {
  id: FHENIX_HELIUM_CHAIN_ID,
  name: 'Fhenix Helium',
  network: 'helium',
  coFheUrl: 'https://testnet-cofhe.fhenix.zone',
  verifierUrl: 'https://testnet-cofhe-vrf.fhenix.zone',
  thresholdNetworkUrl: 'https://testnet-cofhe-tn.fhenix.zone',
  environment: 'TESTNET',
};

export function networkLabel(chainId) {
  return Number(chainId) === FHENIX_HELIUM_CHAIN_ID ? 'Fhenix Helium' : 'Unsupported';
}

export function getExplorerTxUrl(txHash) {
  if (!txHash) return '';
  return `${FHENIX_EXPLORER_BASE_URL}/tx/${txHash}`;
}

export function shortenAddress(value) {
  if (!value) return '';
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}
