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
        <linearGradient id="wcBlue" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#58b4ff" />
          <stop offset="100%" stopColor="#2f6fff" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="26" height="26" rx="10" fill="url(#wcBlue)" />
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

  async function handleConnect() {
    if (!selectedConnector || isPending) return;
    connect({ connector: selectedConnector });
  }

  return (
    <>
      <section className="sb-card relative h-full overflow-hidden">
        <div className="absolute -left-8 -top-8 h-24 w-24 rounded-full bg-emerald-300/20 blur-2xl" />
        <div className="absolute -right-8 -bottom-8 h-24 w-24 rounded-full bg-cyan-300/20 blur-2xl" />

        <div className="relative">
          <p className="sb-eyebrow">Access Layer</p>
          <h3 className="sb-heading-lg mt-2 text-2xl">Secure Wallet Channel</h3>
          <p className="sb-muted mt-2">Connect your wallet through encrypted session routing.</p>
        </div>

        {isConnected ? (
          <div className="relative mt-6 space-y-4">
            <div className="rounded-2xl border border-emerald-300/40 bg-emerald-300/10 p-4">
              <div className="flex items-center gap-3">
                <span className="relative inline-flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-300" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-emerald-100">Connected Securely</p>
                  <p className="font-mono text-xs text-emerald-50/90">{shorten(address)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-200/25 bg-slate-900/45 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Network Status</p>
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
              Connect Securely
            </button>
            <p className="rounded-full border border-emerald-200/20 bg-emerald-200/10 px-3 py-1.5 text-center text-xs font-medium text-emerald-100/90">
              🔒 End-to-End Encrypted
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
              className="w-full max-w-xl rounded-3xl border border-cyan-200/20 bg-slate-950/70 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.25 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="sb-eyebrow">Wallet Connection</p>
                  <h3 className="sb-heading-lg mt-2 text-3xl">Connect Securely</h3>
                  <p className="sb-muted mt-2">Choose a wallet for encrypted trading session access.</p>
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
                          ? 'border-emerald-300/60 bg-gradient-to-br from-emerald-300/18 to-cyan-300/18 shadow-sbGlow'
                          : 'border-cyan-100/20 bg-slate-900/45 hover:border-cyan-100/40 hover:shadow-sbBlueGlow'
                      } ${!isAvailable ? 'cursor-not-allowed opacity-45' : ''}`}
                      whileHover={isAvailable ? { scale: 1.02, y: -2 } : {}}
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
                        <span className="absolute right-3 top-3 rounded-full bg-emerald-300/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-100">
                          Selected
                        </span>
                      ) : null}
                    </motion.button>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1.5 text-xs font-medium text-emerald-100/90">
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
