import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';

import { useDecrypt } from '../hooks/useDecrypt';
import { useShadowBook } from '../hooks/useShadowBook';

function formatTimestamp(timestamp) {
  if (!timestamp) return '--';
  return new Date(Number(timestamp) * 1000).toLocaleString([], {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatMaybeNumber(value, suffix) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '--';
  return `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 4 })} ${suffix}`;
}

export default function TradeHistoryPanel() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { abi, address: contractAddress, isDeployed } = useShadowBook();
  const { decryptOrderResult } = useDecrypt();
  const { writeContractAsync } = useWriteContract();

  const [visibleCount, setVisibleCount] = useState(10);
  const [items, setItems] = useState([]);
  const [allOrderIds, setAllOrderIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);

  const refreshHistory = useCallback(() => {
    setRefreshIndex((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      if (!address || !publicClient || !isDeployed) {
        if (!cancelled) {
          setAllOrderIds([]);
          setItems([]);
        }
        return;
      }

      setLoading(true);

      try {
        const ids = await publicClient.readContract({
          abi,
          address: contractAddress,
          functionName: 'getOrdersByTrader',
          args: [address],
        });

        const normalizedIds = [...ids].map((value) => Number(value)).reverse();
        const visibleIds = normalizedIds.slice(0, visibleCount);

        const rows = await Promise.all(
          visibleIds.map(async (orderId) => {
            const view = await publicClient.readContract({
              abi,
              address: contractAddress,
              functionName: 'getOrderView',
              args: [BigInt(orderId)],
            });

            let decrypted = null;
            if (view.didFill || view.fullyFilled) {
              try {
                decrypted = await decryptOrderResult(orderId);
              } catch (_error) {
                decrypted = null;
              }
            }

            const status = view.cancelled ? 'Cancelled' : view.fullyFilled ? 'Matched' : 'Open';

            return {
              orderId,
              side: view.isBuy ? 'Buy' : 'Sell',
              status,
              executionPrice: decrypted?.executionPrice ?? null,
              filledAmount: decrypted?.filledAmount ?? null,
              placedAt: view.placedAt,
              open: status === 'Open',
            };
          })
        );

        if (!cancelled) {
          setAllOrderIds(normalizedIds);
          setItems(rows);
        }
      } catch (error) {
        if (!cancelled) {
          setActionMessage(error?.shortMessage || error?.message || 'Unable to load order history.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [
    abi,
    address,
    contractAddress,
    decryptOrderResult,
    isDeployed,
    publicClient,
    refreshIndex,
    visibleCount,
  ]);

  async function handleCancel(orderId) {
    if (!publicClient) return;

    setCancellingOrderId(orderId);
    setActionMessage(`Cancelling order #${orderId}...`);

    try {
      const hash = await writeContractAsync({
        abi,
        address: contractAddress,
        functionName: 'cancelOrder',
        args: [BigInt(orderId)],
      });

      await publicClient.waitForTransactionReceipt({ hash });
      setActionMessage(`Order #${orderId} cancelled and escrow released.`);
      refreshHistory();
    } catch (error) {
      setActionMessage(error?.shortMessage || error?.message || `Failed to cancel order #${orderId}.`);
    } finally {
      setCancellingOrderId(null);
    }
  }

  const canLoadMore = useMemo(
    () => allOrderIds.length > visibleCount,
    [allOrderIds.length, visibleCount]
  );

  return (
    <section className="sb-card-secondary space-y-4">
      <div className="space-y-2">
        <p className="sb-eyebrow">History</p>
        <h3 className="text-xl font-semibold text-white">
          Your orders
        </h3>
        <p className="text-sm leading-relaxed text-white/70">
          Decrypted fills and lifecycle status for the connected wallet only.
        </p>
      </div>

      {!isConnected ? (
        <p className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white/70">
          Connect a wallet to load your order history.
        </p>
      ) : null}

      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        {loading ? (
          <p className="text-sm text-white/50">Loading order history...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-white/50">No orders submitted from this wallet yet.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={item.orderId}
                className={`${index < items.length - 1 ? 'border-b border-white/8 pb-3' : ''}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">Order #{item.orderId}</p>
                    <p className="mt-1 text-xs text-white/50">
                      {item.side} · {item.status} · {formatTimestamp(item.placedAt)}
                    </p>
                  </div>
                  {item.open ? (
                    <button
                      type="button"
                      className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/70 transition hover:border-[#ffb36b]/16 hover:text-white"
                      disabled={cancellingOrderId === item.orderId}
                      onClick={() => handleCancel(item.orderId)}
                    >
                      {cancellingOrderId === item.orderId ? 'Cancelling...' : 'Cancel'}
                    </button>
                  ) : null}
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.12em] text-white/50">Execution price</p>
                    <p className="mt-1 text-sm text-white">{formatMaybeNumber(item.executionPrice, 'USDC')}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.12em] text-white/50">Filled amount</p>
                    <p className="mt-1 text-sm text-white">{formatMaybeNumber(item.filledAmount, 'ETH')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {canLoadMore ? (
        <button
          type="button"
          className="sb-button-ghost w-full"
          onClick={() => setVisibleCount((value) => value + 10)}
        >
          Load more
        </button>
      ) : null}

      {actionMessage ? (
        <p className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white/70">
          {actionMessage}
        </p>
      ) : null}
    </section>
  );
}
