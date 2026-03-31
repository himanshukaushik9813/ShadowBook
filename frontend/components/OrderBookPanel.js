import { useEffect, useMemo, useState } from 'react';
import { usePublicClient, useReadContracts } from 'wagmi';
import { decodeEventLog } from 'viem';

import { shadowBookAbi } from '../constants/shadowBookAbi';
import { useShadowBook } from '../hooks/useShadowBook';

function formatTimestamp(timestamp) {
  if (!timestamp) return '--';
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OrderBookPanel() {
  const publicClient = usePublicClient();
  const { abi, address: contractAddress, isDeployed } = useShadowBook();
  const [recentMeta, setRecentMeta] = useState([]);

  const orderBookQuery = useReadContracts({
    contracts: [
      {
        abi,
        address: contractAddress,
        functionName: 'getOrderDepth',
      },
      {
        abi,
        address: contractAddress,
        functionName: 'totalVolumeEncrypted',
      },
      {
        abi,
        address: contractAddress,
        functionName: 'getRecentMatches',
        args: [5n],
      },
    ],
    allowFailure: false,
    query: {
      enabled: isDeployed,
      refetchInterval: 10000,
    },
  });

  const [depth = [0n, 0n], totalMatchedPairs = 0n, recentOrderIds = []] =
    orderBookQuery.data || [];
  const recentOrderIdsKey = useMemo(
    () => (recentOrderIds?.length ? recentOrderIds.map((value) => value.toString()).join(',') : ''),
    [recentOrderIds]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadRecentMatchMeta() {
      if (!publicClient || !isDeployed || !recentOrderIdsKey) {
        if (!cancelled) setRecentMeta([]);
        return;
      }

      const logs = await publicClient.getLogs({
        address: contractAddress,
        fromBlock: 0n,
        toBlock: 'latest',
      });

      const matchedLogs = [];
      for (const log of logs) {
        try {
          const decoded = decodeEventLog({
            abi: shadowBookAbi,
            data: log.data,
            topics: log.topics,
          });

          if (decoded.eventName === 'OrderMatched') {
            matchedLogs.push({
              ...decoded,
              blockNumber: log.blockNumber,
              transactionHash: log.transactionHash,
            });
          }
        } catch (_error) {
          // Ignore unrelated logs.
        }
      }

      const blockCache = new Map();
      const entries = [];

      for (const orderId of recentOrderIdsKey.split(',').map((value) => Number(value))) {
        const match = [...matchedLogs]
          .reverse()
          .find(
            (entry) =>
              Number(entry.args?.orderId) === orderId ||
              Number(entry.args?.counterOrderId) === orderId
          );

        let timestamp = null;
        if (match?.blockNumber) {
          const key = match.blockNumber.toString();
          if (!blockCache.has(key)) {
            blockCache.set(
              key,
              await publicClient.getBlock({ blockNumber: match.blockNumber })
            );
          }
          timestamp = Number(blockCache.get(key)?.timestamp || 0) * 1000;
        }

        entries.push({
          orderId,
          timestamp,
          txHash: match?.transactionHash || '',
        });
      }

      if (!cancelled) {
        setRecentMeta(entries);
      }
    }

    loadRecentMatchMeta();

    return () => {
      cancelled = true;
    };
  }, [contractAddress, isDeployed, publicClient, recentOrderIdsKey]);

  const stats = useMemo(
    () => [
      { label: 'Open buys', value: Number(depth?.[0] || 0n) },
      { label: 'Open sells', value: Number(depth?.[1] || 0n) },
      { label: 'Matched pairs', value: Number(totalMatchedPairs || 0n) },
    ],
    [depth, totalMatchedPairs]
  );

  return (
    <section className="sb-card-secondary space-y-4">
      <div className="space-y-2">
        <p className="sb-eyebrow">Order book</p>
        <h3 className="text-xl font-semibold text-white">
          Encrypted depth
        </h3>
        <p className="text-sm leading-relaxed text-white/70">
          Prices and amounts stay encrypted on-chain. This view shows only aggregate market shape.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <div className="space-y-3">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`flex items-center justify-between gap-3 ${index < stats.length - 1 ? 'border-b border-white/8 pb-3' : ''}`}
            >
              <p className="text-sm text-white/70">{stat.label}</p>
              <p className="text-sm font-semibold text-white">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-white">Recent matched IDs</p>
          <span className="text-xs text-white/50">10s refresh</span>
        </div>

        <div className="mt-3 space-y-2">
          {recentMeta.length === 0 ? (
            <p className="text-sm text-white/50">No matches recorded yet.</p>
          ) : (
            recentMeta.map((entry, index) => (
              <div
                key={`${entry.orderId}-${entry.txHash}`}
                className={`flex items-center justify-between gap-3 text-sm ${index < recentMeta.length - 1 ? 'border-b border-white/8 pb-2' : ''}`}
              >
                <div>
                  <p className="text-white">Order #{entry.orderId}</p>
                  <p className="text-xs text-white/50">{formatTimestamp(entry.timestamp)}</p>
                </div>
                <span className="font-mono text-xs text-[#ffe0c2]">
                  {entry.txHash ? `${entry.txHash.slice(0, 8)}...` : '--'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
