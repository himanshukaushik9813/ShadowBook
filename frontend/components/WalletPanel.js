import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from 'wagmi';
import { sepolia, arbitrumSepolia } from 'wagmi/chains';

function shorten(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function WalletPanel() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect, connectors, isPending, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const networkName = useMemo(() => {
    if (chainId === sepolia.id) return 'Sepolia';
    if (chainId === arbitrumSepolia.id) return 'Arbitrum Sepolia';
    return 'Unsupported';
  }, [chainId]);

  const injectedConnector = useMemo(
    () =>
      connectors.find(
        (connector) =>
          connector.type === 'injected' ||
          connector.id === 'injected' ||
          /injected|browser/i.test(connector.name)
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

  return (
    <div className="glass card wallet-card premium-wallet">
      <p className="eyebrow">Access Layer</p>
      <h3>Secure Wallet Channel</h3>

      {isConnected ? (
        <div className="wallet-connected-zone">
          <div className="wallet-connected-head">
            <div className="connected-indicator-wrap">
              <motion.span
                className="connected-ripple"
                animate={{ scale: [1, 1.9], opacity: [0.65, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
              />
              <span className="connected-dot" />
            </div>
            <div>
              <p className="connected-label">Connected</p>
              <p className="muted small">{shorten(address)}</p>
            </div>
          </div>

          <div className="wallet-meta premium">
            <p>
              <span className="muted">Network:</span> {networkName} ({chainId})
            </p>
          </div>

          <div className="wallet-actions">
            <button
              type="button"
              className="btn secondary"
              onClick={() => switchChain({ chainId: sepolia.id })}
              disabled={isSwitching || chainId === sepolia.id}
            >
              Sepolia
            </button>
            <button
              type="button"
              className="btn secondary"
              onClick={() => switchChain({ chainId: arbitrumSepolia.id })}
              disabled={isSwitching || chainId === arbitrumSepolia.id}
            >
              Arbitrum Sepolia
            </button>
            <button type="button" className="btn danger" onClick={() => disconnect()}>
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        <div className="wallet-actions vertical premium">
          {injectedConnector ? (
            <button
              type="button"
              className="connect-prime-btn"
              disabled={isPending}
              onClick={() => connect({ connector: injectedConnector })}
            >
              Connect Browser Wallet
            </button>
          ) : null}

          {walletConnectConnector ? (
            <button
              type="button"
              className="btn secondary"
              disabled={isPending}
              onClick={() => connect({ connector: walletConnectConnector })}
            >
              Connect WalletConnect
            </button>
          ) : null}

          {connectError ? (
            <p className="error-text small">
              Wallet connect error: {connectError.shortMessage || connectError.message}
            </p>
          ) : null}

          {!injectedConnector ? (
            <p className="muted small">
              Browser wallet extension not detected. Install/unlock MetaMask extension, then refresh.
            </p>
          ) : null}

          {connectors.length > 0 && !walletConnectConnector ? (
            <p className="muted small">
              WalletConnect is disabled because
              {' '}
              <code>NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID</code>
              {' '}
              is empty.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
