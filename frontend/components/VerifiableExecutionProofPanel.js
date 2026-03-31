import { useMemo, useState } from 'react';

import { networkLabel, shortenAddress } from '../constants/network';

function shortHash(value) {
  if (!value) return '--';
  const text = String(value);
  if (text.length <= 18) return text;
  return `${text.slice(0, 10)}...${text.slice(-6)}`;
}

function formatTimestamp(timestamp) {
  if (!timestamp) return '--';

  try {
    return new Date(timestamp).toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (_error) {
    return '--';
  }
}

function formatDisplayNumber(value, suffix = '', maximumFractionDigits = 6) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '--';
  return `${Number(value).toLocaleString(undefined, {
    maximumFractionDigits,
  })}${suffix ? ` ${suffix}` : ''}`;
}

function humanStatus(status) {
  const value = String(status || '').toLowerCase();
  if (value === 'matched') return 'Matched';
  if (value === 'open') return 'Open in book';
  if (value === 'cancelled') return 'Cancelled';
  if (value === 'matching') return 'Matching';
  if (value === 'confirmed') return 'Confirmed';
  if (value === 'failed') return 'Failed';
  return 'Awaiting activity';
}

function SummaryStat({ label, value, mono = false }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <p className="text-xs uppercase tracking-[0.14em] text-white/50">{label}</p>
      <p className={`mt-2 text-sm text-white ${mono ? 'font-mono break-all text-[13px]' : ''}`}>
        {value || '--'}
      </p>
    </div>
  );
}

function GroupedRows({ items, mono = false }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={item.label}
            className={`${index < items.length - 1 ? 'border-b border-white/8 pb-3' : ''}`}
          >
            <p className="text-xs text-white/50">{item.label}</p>
            <p className={`mt-1 text-sm text-white ${mono || item.mono ? 'font-mono break-all text-[13px]' : ''}`}>
              {item.value || '--'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function VerifiableExecutionProofPanel({ flowState }) {
  const [copied, setCopied] = useState(false);

  const tx = flowState?.tx || {};
  const order = flowState?.order || {};
  const plaintext = flowState?.plaintext || {};
  const matched = flowState?.matched || null;
  const decrypted = flowState?.decrypted || null;
  const submission = flowState?.submitted || null;

  const status = order.status || tx.status || 'idle';
  const verificationStatus = humanStatus(status);
  const submissionHash = tx.hash || submission?.txHash || '';
  const submissionExplorer = tx.explorerUrl || submission?.explorerUrl || '';
  const settlementHash = matched?.matchTxHash || '';
  const settlementExplorer = matched?.matchExplorerUrl || '';
  const timestamp = matched?.timestamp || plaintext?.timestamp || null;

  const summaryCells = [
    { label: 'Verification status', value: verificationStatus },
    { label: 'Order ID', value: order.orderId ? `#${order.orderId}` : '--' },
    { label: 'Submission tx', value: shortHash(submissionHash), mono: true },
    { label: 'Match block', value: matched?.blockNumber ? `#${matched.blockNumber}` : '--' },
  ];

  const orderSummary = [
    { label: 'Side', value: order.isBuy === true ? 'Buy' : order.isBuy === false ? 'Sell' : '--' },
    { label: 'Price', value: plaintext.price ? `${formatDisplayNumber(plaintext.price, 'USDC', 4)}` : '--' },
    { label: 'Amount', value: plaintext.amount ? `${formatDisplayNumber(plaintext.amount, 'ETH')}` : '--' },
    { label: 'Escrow', value: plaintext.escrowDisplay || '--' },
    { label: 'Recorded at', value: formatTimestamp(timestamp) },
    { label: 'Network', value: networkLabel(tx.chainId) },
  ];

  const verificationSteps = useMemo(
    () => [
      {
        label: 'Encrypted payload submitted',
        detail: submissionHash
          ? 'The placeOrder transaction confirmed and posted encrypted intent plus real token escrow.'
          : 'Waiting for a submitted order transaction.',
        state: submissionHash ? 'done' : 'idle',
      },
      {
        label: 'Private matching evaluated',
        detail: status === 'open'
          ? 'The order is still resting in the encrypted book and waiting for a counterparty.'
          : matched
            ? 'The order matched without exposing individual price or amount on-chain.'
            : 'No confirmed match yet.',
        state: matched ? 'done' : status === 'matching' || status === 'open' ? 'active' : 'idle',
      },
      {
        label: 'Owner decrypt completed',
        detail: decrypted?.didFill
          ? `Execution price ${formatDisplayNumber(decrypted.executionPrice, 'USDC', 4)} and filled amount ${formatDisplayNumber(decrypted.filledAmount, 'ETH')} were revealed only to the owner.`
          : 'Execution values remain encrypted until the owner decrypts them.',
        state: decrypted?.didFill ? 'done' : status === 'matched' ? 'active' : 'idle',
      },
      {
        label: 'Settlement proof captured',
        detail: matched?.settlementTransfers?.length
          ? 'ERC-20 transfer evidence was parsed directly from the settlement receipt.'
          : 'Settlement evidence will appear once transfer logs are available.',
        state: matched?.settlementTransfers?.length ? 'done' : matched ? 'active' : 'idle',
      },
    ],
    [decrypted, matched, status, submissionHash]
  );

  const proofDetails = [
    {
      label: 'Execution price handle',
      value: matched?.executionPriceHandle || '--',
      mono: true,
    },
    {
      label: 'Filled amount handle',
      value: matched?.filledAmountHandle || '--',
      mono: true,
    },
    {
      label: 'Fill status handle',
      value: matched?.didFillHandle || '--',
      mono: true,
    },
    {
      label: 'Settlement tx',
      value: settlementHash ? shortHash(settlementHash) : '--',
      mono: Boolean(settlementHash),
    },
    {
      label: 'Decrypted execution price',
      value: decrypted?.didFill ? formatDisplayNumber(decrypted.executionPrice, 'USDC', 4) : '--',
    },
    {
      label: 'Decrypted filled amount',
      value: decrypted?.didFill ? formatDisplayNumber(decrypted.filledAmount, 'ETH') : '--',
    },
  ];

  const verificationSnapshot = [
    {
      label: 'Submission anchor',
      value: submissionHash ? shortHash(submissionHash) : 'Awaiting transaction',
    },
    {
      label: 'Settlement receipt',
      value: settlementHash ? shortHash(settlementHash) : 'Pending match',
    },
    {
      label: 'Owner decrypt',
      value: decrypted?.didFill ? 'Completed privately' : 'Still encrypted',
    },
    {
      label: 'Transfer evidence',
      value: matched?.settlementTransfers?.length
        ? `${matched.settlementTransfers.length} log${matched.settlementTransfers.length > 1 ? 's' : ''} parsed`
        : 'No settlement logs yet',
    },
  ];

  const evidenceChecklist = [
    {
      label: 'Encrypted payload committed',
      done: Boolean(submissionHash),
    },
    {
      label: 'Private match confirmed',
      done: Boolean(matched),
    },
    {
      label: 'Owner-side decrypt completed',
      done: Boolean(decrypted?.didFill),
    },
    {
      label: 'ERC-20 settlement verified',
      done: Boolean(matched?.settlementTransfers?.length),
    },
  ];

  const verificationActivity = useMemo(() => {
    const items = [];

    if (submissionHash) {
      items.push({
        label: 'Encrypted order submitted',
        detail: 'The placeOrder transaction anchored encrypted intent and posted real escrow to ShadowBook.',
        meta: shortHash(submissionHash),
      });
    } else {
      items.push({
        label: 'Submission pending',
        detail: 'The proof record starts once a placeOrder transaction has been confirmed on-chain.',
        meta: 'Awaiting tx',
      });
    }

    if (status === 'open' || status === 'matching') {
      items.push({
        label: 'Private matching in progress',
        detail: 'The order is live in the encrypted book and still evaluating counterparties without exposing price or amount.',
        meta: verificationStatus,
      });
    }

    if (matched) {
      items.push({
        label: 'Match confirmed',
        detail: matched?.blockNumber
          ? `A private counterparty match was confirmed in block #${matched.blockNumber}.`
          : 'A private counterparty match was confirmed.',
        meta: formatTimestamp(timestamp),
      });
    }

    if (decrypted?.didFill) {
      items.push({
        label: 'Owner decrypt completed',
        detail: `Execution price ${formatDisplayNumber(decrypted.executionPrice, 'USDC', 4)} and filled amount ${formatDisplayNumber(
          decrypted.filledAmount,
          'ETH'
        )} were revealed only to the owner.`,
        meta: 'Owner-visible',
      });
    }

    if (matched?.settlementTransfers?.length) {
      items.push({
        label: 'Settlement evidence captured',
        detail: `${matched.settlementTransfers.length} ERC-20 transfer log${matched.settlementTransfers.length > 1 ? 's were' : ' was'} parsed from the settlement receipt.`,
        meta: settlementHash ? shortHash(settlementHash) : 'Receipt parsed',
      });
    }

    return items.slice(0, 5);
  }, [
    decrypted?.didFill,
    decrypted?.executionPrice,
    decrypted?.filledAmount,
    matched,
    settlementHash,
    status,
    submissionHash,
    timestamp,
    verificationStatus,
  ]);

  async function handleCopyHash() {
    const value = settlementHash || submissionHash;
    if (!value || typeof navigator === 'undefined' || !navigator.clipboard?.writeText) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  function handleExportProof() {
    if (typeof window === 'undefined') return;

    const payload = {
      status,
      orderId: order.orderId || null,
      submissionTxHash: submissionHash || null,
      settlementTxHash: settlementHash || null,
      chain: networkLabel(tx.chainId),
      matchBlockNumber: matched?.blockNumber || null,
      timestamp,
      executionPriceHandle: matched?.executionPriceHandle || null,
      filledAmountHandle: matched?.filledAmountHandle || null,
      didFillHandle: matched?.didFillHandle || null,
      decryptedExecutionPrice: decrypted?.executionPrice ?? null,
      decryptedFilledAmount: decrypted?.filledAmount ?? null,
      settlementTransfers: matched?.settlementTransfers || [],
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `shadowbook-proof-${order.orderId || 'draft'}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {summaryCells.map((cell) => (
          <SummaryStat key={cell.label} label={cell.label} value={cell.value} mono={cell.mono} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.75fr)_minmax(340px,0.85fr)] xl:items-start">
        <div className="space-y-6">
          <section className="sb-card-primary space-y-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <p className="sb-eyebrow">Primary proof workspace</p>
                <h3 className="mt-2 text-xl font-semibold text-white">
                  Verification timeline
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                  Follow the proof lifecycle from encrypted submission to owner-side decrypt and final settlement verification in one working surface.
                </p>
              </div>
              <span className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/70">
                {verificationStatus}
              </span>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.18fr)_minmax(300px,0.82fr)]">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                <div className="space-y-4">
                  {verificationSteps.map((step, index) => (
                    <div key={step.label} className="grid grid-cols-[auto_1fr] gap-4">
                      <div className="flex w-8 flex-col items-center">
                        <span
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-[11px] font-medium ${
                            step.state === 'done'
                              ? 'border-[#ffb36b]/18 bg-[#ff8a3c]/[0.08] text-[#ffe0c2]'
                              : step.state === 'active'
                                ? 'border-white/12 bg-white/[0.04] text-white'
                                : 'border-white/10 bg-white/[0.02] text-white/50'
                          }`}
                        >
                          {step.state === 'done' ? '✓' : index + 1}
                        </span>
                        {index < verificationSteps.length - 1 ? <span className="mt-2 h-full w-px bg-white/8" /> : null}
                      </div>
                      <div className="pb-5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-medium text-white">{step.label}</p>
                          <span className="text-xs text-white/50">
                            {step.state === 'done' ? 'Verified' : step.state === 'active' ? 'In progress' : 'Pending'}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-white/70">{step.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-white/50">Current snapshot</p>
                  <div className="mt-4 space-y-3">
                    {verificationSnapshot.map((item, index) => (
                      <div
                        key={item.label}
                        className={index < verificationSnapshot.length - 1 ? 'border-b border-white/8 pb-3' : ''}
                      >
                        <p className="text-xs text-white/50">{item.label}</p>
                        <p className="mt-1 text-sm text-white">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-white/50">Recent verification activity</p>
                    <span className="text-xs text-white/50">{verificationActivity.length} events</span>
                  </div>
                  <div className="mt-4 space-y-4">
                    {verificationActivity.map((item, index) => (
                      <div
                        key={`${item.label}-${index}`}
                        className={`${index < verificationActivity.length - 1 ? 'border-b border-white/8 pb-4' : ''}`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="text-sm font-medium text-white">{item.label}</p>
                          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/60">
                            {item.meta}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-white/70">{item.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="sb-card-primary space-y-6">
            <div className="max-w-2xl">
              <p className="sb-eyebrow">Secondary proof module</p>
              <h3 className="mt-2 text-xl font-semibold text-white">
                Settlement evidence workspace
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                Review the final transfer evidence alongside a compact checklist that confirms which proof artifacts are already available.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.22fr)_minmax(260px,0.78fr)]">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                {matched?.settlementTransfers?.length ? (
                  <div className="space-y-4">
                    {matched.settlementTransfers.map((transfer, index) => (
                      <div
                        key={`${transfer.token}-${transfer.to}-${index}`}
                        className={`${index < matched.settlementTransfers.length - 1 ? 'border-b border-white/8 pb-4' : ''}`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm font-medium text-white">{transfer.token}</p>
                          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/60">
                            Verified transfer
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-white">
                          {transfer.amountFormatted} transferred to{' '}
                          <span className="font-mono text-[#ffe0c2]">{shortenAddress(transfer.to)}</span>
                        </p>
                        <p className="mt-2 text-xs leading-relaxed text-white/50">
                          From {shortenAddress(transfer.from)} to {shortenAddress(transfer.to)} using the settlement receipt emitted after the encrypted match finalized.
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-white">Settlement evidence pending</p>
                    <p className="text-sm leading-relaxed text-white/70">
                      Submit an order and complete a match to populate this workspace with real ERC-20 transfer logs and settlement confirmation details.
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-white/50">Evidence checklist</p>
                <div className="mt-4 space-y-3">
                  {evidenceChecklist.map((item, index) => (
                    <div
                      key={item.label}
                      className={`flex items-start gap-3 ${index < evidenceChecklist.length - 1 ? 'border-b border-white/8 pb-3' : ''}`}
                    >
                      <span
                        className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${
                          item.done
                            ? 'border-[#ffb36b]/18 bg-[#ff8a3c]/[0.08] text-[#ffe0c2]'
                            : 'border-white/10 bg-white/[0.02] text-white/50'
                        }`}
                      >
                        {item.done ? '✓' : '•'}
                      </span>
                      <p className="text-sm text-white/70">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="sb-card-secondary space-y-4">
            <div>
              <p className="sb-eyebrow">Proof status</p>
              <h3 className="mt-2 text-lg font-medium text-white">Session and network</h3>
            </div>
            <GroupedRows
              items={[
                { label: 'Network', value: networkLabel(tx.chainId) },
                { label: 'Active status', value: verificationStatus },
                { label: 'Recorded at', value: formatTimestamp(timestamp) },
              ]}
            />
          </section>

          <section className="sb-card-secondary space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="sb-eyebrow">Order summary</p>
                <h3 className="mt-2 text-lg font-medium text-white">Captured inputs</h3>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/70">
                {verificationStatus}
              </span>
            </div>
            <GroupedRows items={orderSummary} />
          </section>

          <section className="sb-card-secondary space-y-4">
            <div>
              <p className="sb-eyebrow">Proof details</p>
              <h3 className="mt-2 text-lg font-medium text-white">Handles and decrypts</h3>
            </div>
            <GroupedRows items={proofDetails} />
          </section>

          <section className="sb-card-secondary space-y-4">
            <div>
              <p className="sb-eyebrow">Actions</p>
              <h3 className="mt-2 text-lg font-medium text-white">Export or inspect</h3>
            </div>
            <p className="text-sm leading-relaxed text-white/70">
              {status === 'matched'
                ? 'The order matched privately, and settlement proof is derived from actual on-chain transfer logs.'
                : status === 'open'
                  ? 'The order is still live in the encrypted book. Return here after a counterparty matches.'
                  : status === 'cancelled'
                    ? 'The order was cancelled and remaining escrow was released back to the wallet.'
                    : 'Submit an order to generate a complete proof record.'}
            </p>
            <div className="space-y-2">
              <button
                type="button"
                className="sb-button-ghost w-full justify-between"
                onClick={handleCopyHash}
                disabled={!submissionHash && !settlementHash}
              >
                <span>{copied ? 'Hash copied' : 'Copy active hash'}</span>
                <span className="text-xs text-white/50">↗</span>
              </button>
              <a
                href={submissionExplorer || undefined}
                target="_blank"
                rel="noreferrer"
                className={`sb-button-ghost w-full justify-between ${
                  submissionExplorer ? '' : 'pointer-events-none opacity-50'
                }`}
              >
                <span>Open submission tx</span>
                <span className="text-xs text-white/50">↗</span>
              </a>
              <a
                href={settlementExplorer || undefined}
                target="_blank"
                rel="noreferrer"
                className={`sb-button-ghost w-full justify-between ${
                  settlementExplorer ? '' : 'pointer-events-none opacity-50'
                }`}
              >
                <span>Open settlement tx</span>
                <span className="text-xs text-white/50">↗</span>
              </a>
              <button
                type="button"
                className="sb-button-ghost w-full justify-between"
                onClick={handleExportProof}
              >
                <span>Export proof JSON</span>
                <span className="text-xs text-white/50">↗</span>
              </button>
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
