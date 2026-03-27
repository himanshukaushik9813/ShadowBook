import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAccount, useChainId, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { arbitrumSepolia, sepolia } from 'wagmi/chains';

function shorten(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function MetamaskIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className="h-9 w-9">
      <defs>
        <linearGradient id="mmHead" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#ffb36b" />
          <stop offset="100%" stopColor="#ef6d3d" />
        </linearGradient>
      </defs>
      <path d="M5 5l8 6-3 7z" fill="#f89c35" />
      <path d="M27 5l-8 6 3 7z" fill="#f89c35" />
      <path d="M8 20l5 5 3-2 3 2 5-5-3-5H11z" fill="url(#mmHead)" />
      <path d="M13 25l3-2 3 2-3 3z" fill="#ce4f2d" />
    </svg>
  );
}

function WalletConnectIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className="h-9 w-9">
      <defs>
        <linearGradient id="wcWarm" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#ffb36b" />
          <stop offset="100%" stopColor="#d9772d" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="26" height="26" rx="10" fill="url(#wcWarm)" />
      <path
        d="M9 14.5c3.8-3.8 10.2-3.8 14 0M11.8 17.2c2.2-2.2 6.2-2.2 8.4 0M15.2 20.8c.4-.4 1.2-.4 1.6 0"
        fill="none"
        stroke="#eef7ff"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function WalletPanel() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect, connectors, isPending, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState('metamask');

  const networkName = useMemo(() => {
    if (chainId === sepolia.id) return 'Sepolia';
    if (chainId === arbitrumSepolia.id) return 'Arbitrum Sepolia';
    return 'Unsupported network';
  }, [chainId]);

  const injectedConnector = useMemo(
    () =>
      connectors.find(
        (connector) =>
          connector.type === 'injected' ||
          connector.id === 'injected' ||
          /injected|browser|metamask/i.test(connector.name)
      ) || null,
    [connectors]
  );
  const walletConnectConnector = useMemo(
    () =>
      connectors.find(
        (connector) => connector.id === 'walletConnect' || /walletconnect/i.test(connector.name)
      ) || null,
    [connectors]
  );

  const walletOptions = useMemo(
    () => [
      {
        key: 'metamask',
        title: 'MetaMask',
        subtitle: 'Secure encrypted connection',
        connector: injectedConnector,
        icon: <MetamaskIcon />,
      },
      {
        key: 'walletconnect',
        title: 'WalletConnect',
        subtitle: 'Secure encrypted connection',
        connector: walletConnectConnector,
        icon: <WalletConnectIcon />,
      },
    ],
    [injectedConnector, walletConnectConnector]
  );

  const selectedConnector =
    walletOptions.find((wallet) => wallet.key === selectedWallet)?.connector || null;

  useEffect(() => {
    if (!isConnected) return;
    setIsModalOpen(false);
  }, [isConnected]);

  useEffect(() => {
    function openWalletModal() {
      if (!isConnected) {
        setIsModalOpen(true);
      }
    }

    window.addEventListener('shadowbook:open-wallet', openWalletModal);
    return () => window.removeEventListener('shadowbook:open-wallet', openWalletModal);
  }, [isConnected]);

  async function handleConnect() {
    if (!selectedConnector || isPending) return;
    connect({ connector: selectedConnector });
  }

  return (
    <>
      <section id="wallet-panel" className="sb-card h-full">
        <div>
          <p className="sb-eyebrow">Wallet</p>
          <h3 className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-white">
            Connection
          </h3>
          <p className="sb-muted mt-2">Connect a wallet before submitting an encrypted order.</p>
        </div>

        {isConnected ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-[#ffb36b]/16 bg-[#ff8a3c]/[0.08] p-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#ffb36b]" />
                <div>
                  <p className="text-sm font-semibold text-[#ffe0c2]">Connected securely</p>
                  <p className="font-mono text-xs text-slate-300">{shorten(address)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/8 bg-[rgba(8,7,6,0.42)] p-4">
              <p className="text-xs font-medium text-slate-500">Network</p>
              <p className="mt-2 text-sm font-medium text-slate-100">
                {networkName}
                {' '}
                <span className="font-mono text-slate-300">({chainId})</span>
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                className="sb-button-ghost"
                onClick={() => switchChain({ chainId: sepolia.id })}
                disabled={isSwitching || chainId === sepolia.id}
              >
                Switch to Sepolia
              </button>
              <button
                type="button"
                className="sb-button-ghost"
                onClick={() => switchChain({ chainId: arbitrumSepolia.id })}
                disabled={isSwitching || chainId === arbitrumSepolia.id}
              >
                Switch to Arbitrum
              </button>
            </div>

            <button type="button" className="sb-button-ghost w-full border-rose-300/30 text-rose-100" onClick={() => disconnect()}>
              Disconnect
            </button>
          </div>
        ) : (
          <div className="relative mt-6 space-y-3">
            <button type="button" className="sb-button-primary w-full" onClick={() => setIsModalOpen(true)}>
              Connect Wallet
            </button>
            <p className="rounded-full border border-white/8 bg-white/[0.02] px-3 py-1.5 text-center text-xs text-slate-400">
              Encrypted session
            </p>
            {!injectedConnector ? (
              <p className="sb-muted">
                MetaMask extension not detected. Install or unlock it, then refresh.
              </p>
            ) : null}
            {!walletConnectConnector ? (
              <p className="sb-muted">
                WalletConnect disabled. Add
                {' '}
                <code className="font-mono text-xs">NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID</code>
                {' '}
                to enable QR connections.
              </p>
            ) : null}
          </div>
        )}
      </section>

      <AnimatePresence>
        {isModalOpen && !isConnected ? (
          <motion.div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 px-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              className="relative w-full max-w-xl overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,14,11,0.94),rgba(11,9,8,0.92))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.46)]"
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.25 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#ffb36b]/25 to-transparent" />
              <div className="absolute left-[-30px] top-14 h-24 w-24 rounded-full bg-[#ff8a3c]/[0.08] blur-[70px]" />
              <div className="absolute bottom-10 right-[-34px] h-28 w-28 rounded-full bg-[#f59e0b]/[0.06] blur-[76px]" />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="sb-eyebrow">Wallet Connection</p>
                  <h3 className="mt-2 font-display text-3xl font-semibold tracking-[-0.03em] text-white">
                    Connect wallet
                  </h3>
                  <p className="sb-muted mt-2">Choose a wallet to start a private trading session.</p>
                </div>
                <button
                  type="button"
                  className="h-9 w-9 rounded-xl border border-white/15 text-lg text-slate-300 transition hover:border-white/30 hover:text-white"
                  onClick={() => setIsModalOpen(false)}
                >
                  ×
                </button>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {walletOptions.map((wallet) => {
                  const isSelected = selectedWallet === wallet.key;
                  const isAvailable = Boolean(wallet.connector);
                  return (
                    <motion.button
                      key={wallet.key}
                      type="button"
                      disabled={!isAvailable || isPending}
                      className={`group relative rounded-2xl border p-4 text-left transition ${
                        isSelected
                          ? 'border-[#ffb36b]/18 bg-[#ff8a3c]/[0.08]'
                          : 'border-white/10 bg-white/[0.02] hover:border-white/16'
                      } ${!isAvailable ? 'cursor-not-allowed opacity-45' : ''}`}
                      whileHover={isAvailable ? { scale: 1.01, y: -1 } : {}}
                      whileTap={isAvailable ? { scale: 0.99 } : {}}
                      onClick={() => setSelectedWallet(wallet.key)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl border border-white/10 bg-white/5 p-2">{wallet.icon}</div>
                        <div>
                          <p className="text-sm font-semibold text-slate-100">{wallet.title}</p>
                          <p className="text-xs text-slate-400">{wallet.subtitle}</p>
                        </div>
                      </div>
                      {isSelected ? (
                        <span className="absolute right-3 top-3 rounded-full bg-[#ff8a3c]/[0.08] px-2 py-1 text-[10px] font-medium text-[#ffe0c2]">
                          Selected
                        </span>
                      ) : null}
                    </motion.button>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <span className="rounded-full border border-[#ffb36b]/18 bg-[#ff8a3c]/[0.08] px-3 py-1.5 text-xs font-medium text-[#ffe0c2]">
                  🔒 End-to-End Encrypted
                </span>
                <button
                  type="button"
                  className="sb-button-primary min-w-44"
                  onClick={handleConnect}
                  disabled={!selectedConnector || isPending}
                >
                  {isPending ? 'Connecting...' : 'Connect Securely'}
                </button>
              </div>

              {connectError ? (
                <p className="mt-4 rounded-xl border border-rose-300/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                  {connectError.shortMessage || connectError.message}
                </p>
              ) : null}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
