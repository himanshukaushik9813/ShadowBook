import { useMemo } from 'react';
import {
  CofheProvider,
  createCofheConfig,
  useCofheAutoConnect,
} from '@cofhe/react';
import { arbSepolia as cofheArbSepolia, sepolia as cofheSepolia } from '@cofhe/sdk/chains';
import { usePublicClient, useWalletClient } from 'wagmi';

function CofheAutoConnector({ walletClient, publicClient }) {
  useCofheAutoConnect({ walletClient, publicClient });
  return null;
}

export default function CofheBridge({ children }) {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const cofheConfig = useMemo(
    () =>
      createCofheConfig({
        supportedChains: [cofheSepolia, cofheArbSepolia],
        defaultPermitExpiration: 60 * 60 * 24 * 7,
      }),
    []
  );

  return (
    <CofheProvider config={cofheConfig} walletClient={walletClient} publicClient={publicClient}>
      <CofheAutoConnector walletClient={walletClient} publicClient={publicClient} />
      {children}
    </CofheProvider>
  );
}
