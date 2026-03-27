import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { arbitrumSepolia, sepolia } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

import '@cofhe/react/styles.css';
import '../styles/tailwind.css';

const queryClient = new QueryClient();

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://shadow-book-black.vercel.app';

const connectors = [injected()];

if (walletConnectProjectId) {
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

const wagmiConfig = createConfig({
  chains: [sepolia, arbitrumSepolia],
  connectors,
  transports: {
    [sepolia.id]: http(
      process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://ethereum-sepolia.publicnode.com'
    ),
    [arbitrumSepolia.id]: http(
      process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL ||
        'https://arbitrum-sepolia.publicnode.com'
    ),
  },
  ssr: false,
});

export default function App({ Component, pageProps }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <Component {...pageProps} />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
