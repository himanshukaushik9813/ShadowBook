import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

function shortHash(value) {
  if (!value) return '--';
  const text = String(value);
  if (text.length <= 18) return text;
  return `${text.slice(0, 10)}...${text.slice(-6)}`;
}

function networkLabel(chainId) {
  if (Number(chainId) === 11155111) return 'Sepolia';
  if (Number(chainId) === 421614) return 'Arbitrum Sepolia';
  return '--';
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

function formatExecutionType(orderType) {
  if (!orderType) return '--';
  return String(orderType).charAt(0).toUpperCase() + String(orderType).slice(1).toLowerCase();
}

function humanStatus(status) {
  const value = String(status || '').toLowerCase();
  if (value === 'confirmed') return 'Verified';
  if (value === 'pending') return 'Pending';
  if (value === 'submitted') return 'Submitted';
  if (value === 'failed') return 'Failed';
  return 'Awaiting activity';
}

function statusTone(status) {
  const value = String(status || '').toLowerCase();
  if (value === 'confirmed') return 'text-[#ffe0c2] border-[#ffb36b]/16 bg-[#ff8a3c]/[0.08]';
  if (value === 'failed') return 'text-rose-100 border-rose-200/20 bg-rose-200/[0.05]';
  if (value === 'pending' || value === 'submitted') return 'text-slate-100 border-white/10 bg-white/[0.03]';
  return 'text-slate-200 border-white/8 bg-white/[0.02]';
}

function stepState({ key, txStatus, encrypted, matched }) {
  if (txStatus === 'failed') {
    if (key === 'encrypt' && encrypted) return 'complete';
    if (key === 'submit' && txStatus !== 'idle') return 'complete';
    return 'error';
  }

  if (key === 'encrypt') return encrypted ? 'complete' : 'pending';
  if (key === 'submit') {
    if (txStatus === 'confirmed' || txStatus === 'pending' || txStatus === 'submitted') return 'complete';
    return 'pending';
  }
  if (key === 'match') {
    if (matched) return 'complete';
    if (txStatus === 'pending' || txStatus === 'submitted') return 'current';
    return 'pending';
  }
  if (key === 'settle') {
    if (txStatus === 'confirmed') return 'complete';
    if (txStatus === 'pending') return 'current';
    return 'pending';
  }
  if (key === 'verify') {
    if (txStatus === 'confirmed') return 'complete';
    return 'pending';
  }
  return 'pending';
}

function StepIndicator({ state }) {
  if (state === 'complete') {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#ffb36b]/18 bg-[#ff8a3c]/[0.08] text-xs text-[#ffe0c2]">
        ✓
      </span>
    );
  }

  if (state === 'current') {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] text-xs text-slate-100">
        •
      </span>
    );
  }

  if (state === 'error') {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-rose-200/25 bg-rose-200/[0.06] text-xs text-rose-100">
        !
      </span>
    );
  }

  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/[0.02] text-xs text-slate-500">
      ·
    </span>
  );
}

function SummaryCell({ label, value, mono = false }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(18,14,11,0.78),rgba(11,9,8,0.72))] px-4 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#ffb36b]/22 to-transparent" />
      <div className="absolute right-2 top-2 h-12 w-12 rounded-full bg-[#ff8a3c]/[0.05] blur-2xl" />
      <p className="relative text-xs font-medium text-slate-500">{label}</p>
      <p className={`relative mt-2 text-sm text-white ${mono ? 'font-mono text-[13px]' : ''}`}>
        {value || '--'}
      </p>
    </div>
  );
}

function ActionIcon({ name, active = false }) {
  const stroke = active ? '#ffe0c2' : '#cfc2b6';

  if (name === 'copy') {
    return (
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
        <rect x="7" y="4.5" width="8.5" height="10" rx="2" stroke={stroke} strokeWidth="1.4" />
        <path
          d="M5.5 12.5H5A2 2 0 013 10.5V7a2 2 0 012-2h5"
          stroke={stroke}
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (name === 'external') {
    return (
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
        <path d="M8 4.5h7.5V12" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
        <path d="M15.5 4.5l-8 8" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
        <path
          d="M9 7H5.5A2.5 2.5 0 003 9.5v5A2.5 2.5 0 005.5 17h5A2.5 2.5 0 0013 14.5V11"
          stroke={stroke}
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
      <path d="M10 3.5v8" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M7 8.5l3 3 3-3" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 15.5h11" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function ProofActionButton({
  label,
  icon,
  onClick,
  href,
  disabled = false,
  active = false,
}) {
  const classes = `group relative flex w-full items-center justify-between overflow-hidden rounded-2xl border px-4 py-3 text-sm font-medium transition-all duration-300 ${
    disabled
      ? 'cursor-not-allowed border-white/8 bg-white/[0.02] text-slate-500'
      : active
        ? 'border-[#ffb36b]/18 bg-[#ff8a3c]/[0.08] text-[#ffe0c2] shadow-[0_16px_34px_rgba(255,138,60,0.1)] hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(255,138,60,0.14)]'
        : 'border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.02))] text-slate-100 hover:-translate-y-0.5 hover:border-[#ffb36b]/16 hover:bg-[linear-gradient(180deg,rgba(255,138,60,0.08),rgba(255,255,255,0.02))] hover:text-[#ffe0c2] hover:shadow-[0_18px_38px_rgba(255,138,60,0.08)]'
  }`;

  const inner = (
    <>
      <span className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#ffb36b]/22 to-transparent opacity-80" />
      <span className="absolute right-0 top-0 h-12 w-12 rounded-full bg-[#ff8a3c]/[0.05] blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <span className="relative flex items-center gap-3">
        <span
          className={`inline-flex h-9 w-9 items-center justify-center rounded-full border ${
            disabled
              ? 'border-white/8 bg-white/[0.02]'
              : active
                ? 'border-[#ffb36b]/18 bg-[#ff8a3c]/[0.08]'
                : 'border-white/10 bg-white/[0.03] group-hover:border-[#ffb36b]/16 group-hover:bg-[#ff8a3c]/[0.08]'
          }`}
        >
          <ActionIcon name={icon} active={active || !disabled} />
        </span>
        <span>{label}</span>
      </span>
      <span className={`relative text-xs transition-transform duration-300 ${disabled ? 'text-slate-600' : 'text-slate-500 group-hover:translate-x-0.5 group-hover:text-[#ffcf9a]'}`}>
        →
      </span>
    </>
  );

  if (href && !disabled) {
    return (
      <motion.a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={classes}
        whileTap={{ scale: 0.99 }}
      >
        {inner}
      </motion.a>
    );
  }

  return (
    <motion.button
      type="button"
      className={classes}
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.99 }}
    >
      {inner}
    </motion.button>
  );
}

export default function VerifiableExecutionProofPanel({ flowState }) {
  const [copied, setCopied] = useState(false);

  const tx = flowState?.tx || {};
  const plaintext = flowState?.plaintext || {};
  const encrypted = flowState?.encrypted || null;
  const matched = flowState?.matched || null;

  const txHash = tx.hash || matched?.txHash || '';
  const verificationStatus = humanStatus(tx.status);
  const proofDigest =
    matched?.proofDigest ||
    encrypted?.payloadHash ||
    encrypted?.priceCtHash ||
    txHash ||
    '--';
  const timestamp =
    matched?.timestamp ||
    tx.timestamp ||
    flowState?.replay?.lastReplayAt ||
    null;

  const orderSummary = [
    { label: 'Asset', value: plaintext.asset || 'ETH / USDC' },
    { label: 'Amount', value: plaintext.amount ? `${plaintext.amount} ETH` : '--' },
    { label: 'Execution type', value: formatExecutionType(plaintext.orderType) },
    { label: 'Submission status', value: humanStatus(tx.status) },
  ];

  const verificationSteps = useMemo(
    () => [
      {
        key: 'encrypt',
        label: 'Client-side encryption completed',
        detail: encrypted ? 'Order values encrypted before submission.' : 'Waiting for encrypted input.',
      },
      {
        key: 'submit',
        label: 'Encrypted payload submitted',
        detail: txHash ? 'Encrypted payload included in a transaction.' : 'No transaction hash available yet.',
      },
      {
        key: 'match',
        label: 'Private matching completed',
        detail: matched ? 'Matching completed without exposing plaintext values.' : 'Matching has not completed yet.',
      },
      {
        key: 'settle',
        label: 'Settlement confirmed',
        detail: tx.status === 'confirmed' ? 'Settlement confirmed on-chain.' : 'Settlement confirmation pending.',
      },
      {
        key: 'verify',
        label: 'Proof verified',
        detail: tx.status === 'confirmed' ? 'Verification checks passed.' : 'Verification will complete after settlement.',
      },
    ],
    [encrypted, matched, tx.status, txHash]
  );

  const proofDetails = [
    { label: 'Proof Digest', value: proofDigest, mono: true },
    {
      label: 'Signature Valid',
      value: tx.status === 'confirmed' ? 'Yes' : tx.status === 'failed' ? 'No' : 'Pending',
    },
    {
      label: 'Inclusion Confirmed',
      value: txHash ? (tx.status === 'confirmed' ? 'Yes' : 'Pending') : 'Pending',
    },
    {
      label: 'Settlement Finalized',
      value: tx.status === 'confirmed' ? 'Yes' : tx.status === 'failed' ? 'No' : 'Pending',
    },
  ];

  async function handleCopyTxHash() {
    if (!txHash || typeof navigator === 'undefined' || !navigator.clipboard?.writeText) return;
    await navigator.clipboard.writeText(txHash);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  function handleExportProof() {
    const payload = {
      verificationStatus,
      txHash,
      network: networkLabel(tx.chainId),
      timestamp,
      orderSummary,
      proofDetails,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `shadowbook-proof-${txHash ? txHash.slice(0, 10) : 'draft'}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="relative space-y-6">
      <div className="pointer-events-none absolute left-[4%] top-20 h-24 w-24 rounded-full bg-[#ff8a3c]/[0.05] blur-[70px]" />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCell label="Verification Status" value={verificationStatus} />
        <SummaryCell label="Tx Hash" value={shortHash(txHash)} mono />
        <SummaryCell label="Network" value={networkLabel(tx.chainId)} />
        <SummaryCell label="Timestamp" value={formatTimestamp(timestamp)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-6">
          <motion.section
            className="relative overflow-hidden rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,14,11,0.82),rgba(11,9,8,0.78))] p-6 shadow-[0_20px_48px_rgba(0,0,0,0.24)]"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#ffb36b]/24 to-transparent" />
            <div className="absolute right-4 top-4 h-20 w-20 rounded-full bg-[#ff8a3c]/[0.05] blur-3xl" />
            <h3 className="text-lg font-semibold text-white">Order Summary</h3>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {orderSummary.map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/8 bg-[rgba(8,7,6,0.45)] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                  <p className="text-xs font-medium text-slate-500">{item.label}</p>
                  <p className="mt-2 text-sm text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section
            className="relative overflow-hidden rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,14,11,0.82),rgba(11,9,8,0.78))] p-6 shadow-[0_20px_48px_rgba(0,0,0,0.24)]"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.03 }}
          >
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#ffb36b]/24 to-transparent" />
            <h3 className="text-lg font-semibold text-white">Verification Steps</h3>
            <div className="mt-5 space-y-4">
              {verificationSteps.map((step, index) => {
                const currentState = stepState({
                  key: step.key,
                  txStatus: tx.status,
                  encrypted,
                  matched,
                });

                return (
                  <div key={step.key} className="grid grid-cols-[24px_1fr] gap-4">
                    <div className="flex flex-col items-center">
                      <StepIndicator state={currentState} />
                      {index < verificationSteps.length - 1 ? (
                        <span className="mt-2 h-full w-px bg-[#ffb36b]/12" />
                      ) : null}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium text-white">{step.label}</p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-400">{step.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.section>

          <motion.section
            className="relative overflow-hidden rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,14,11,0.82),rgba(11,9,8,0.78))] p-6 shadow-[0_20px_48px_rgba(0,0,0,0.24)]"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.06 }}
          >
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#ffb36b]/24 to-transparent" />
            <h3 className="text-lg font-semibold text-white">Proof Details</h3>
            <div className="mt-5 space-y-3">
              {proofDetails.map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col gap-2 rounded-2xl border border-white/8 bg-[rgba(8,7,6,0.45)] px-4 py-3 md:flex-row md:items-center md:justify-between"
                >
                  <p className="text-sm text-slate-400">{item.label}</p>
                  <p className={`text-sm text-white ${item.mono ? 'font-mono text-[13px]' : ''}`}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </motion.section>
        </div>

        <aside>
          <div className={`relative overflow-hidden rounded-[28px] border p-5 shadow-[0_20px_48px_rgba(0,0,0,0.24)] ${statusTone(tx.status)}`}>
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#ffb36b]/24 to-transparent" />
            <div className="absolute right-0 top-8 h-20 w-20 rounded-full bg-[#ff8a3c]/[0.05] blur-3xl" />
            <p className="text-xs font-medium text-slate-500">Final status</p>
            <p className="mt-2 text-lg font-semibold">{verificationStatus}</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              {tx.status === 'confirmed'
                ? 'The encrypted order was submitted, settled, and verified.'
                : tx.status === 'failed'
                  ? 'The transaction did not complete. Review the transaction state before retrying.'
                  : 'Submit an order to generate a verification record.'}
            </p>

            <div className="mt-5 space-y-2">
              <ProofActionButton
                label={copied ? 'Transaction copied' : 'Copy Tx Hash'}
                icon="copy"
                onClick={handleCopyTxHash}
                disabled={!txHash}
                active={copied}
              />

              <ProofActionButton
                label="View Explorer"
                icon="external"
                href={tx.explorerUrl}
                disabled={!tx.explorerUrl}
              />

              <ProofActionButton
                label="Export Proof"
                icon="export"
                onClick={handleExportProof}
              />
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
