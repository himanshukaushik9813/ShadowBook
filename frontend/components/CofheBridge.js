'use client';

import { useMemo } from 'react';
import {
  CofheProvider,
  createCofheConfig,
  useCofheAutoConnect,
} from '@cofhe/react';
import { usePublicClient, useWalletClient } from 'wagmi';

import { cofheHeliumChain } from '../constants/network';

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
        supportedChains: [cofheHeliumChain],
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
