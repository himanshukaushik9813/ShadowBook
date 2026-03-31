'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';

import { FHENIX_RPC_URL, fhenixHeliumChain } from '../constants/network';

const CofheBridge = dynamic(() => import('./CofheBridge'), {
  ssr: false,
  loading: () => null,
});

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://shadow-book-black.vercel.app';

export default function AppProviders({ children }) {
  const [queryClient] = useState(() => new QueryClient());
  const baseConfig = useMemo(
    () =>
      createConfig({
        chains: [fhenixHeliumChain],
        connectors: [],
        transports: {
          [fhenixHeliumChain.id]: http(FHENIX_RPC_URL),
        },
        ssr: false,
      }),
    []
  );
  const [wagmiConfig, setWagmiConfig] = useState(baseConfig);

  useEffect(() => {
    let cancelled = false;

    async function setupConfig() {
      const { injected } = await import('wagmi/connectors');
      const connectors = [injected()];

      if (walletConnectProjectId) {
        const { walletConnect } = await import('wagmi/connectors');
        connectors.push(
          walletConnect({
            projectId: walletConnectProjectId,
            showQrModal: true,
            metadata: {
              name: 'ShadowBook',
              description: 'Encrypted Orderflow Layer powered by CoFHE',
              url: appUrl,
              icons: ['https://walletconnect.com/walletconnect-logo.png'],
            },
          })
        );
      }

      if (cancelled) return;

      setWagmiConfig(
        createConfig({
          chains: [fhenixHeliumChain],
          connectors,
          transports: {
            [fhenixHeliumChain.id]: http(FHENIX_RPC_URL),
          },
          ssr: false,
        })
      );
    }

    setupConfig();

    return () => {
      cancelled = true;
    };
  }, [baseConfig]);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <CofheBridge>{children}</CofheBridge>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
