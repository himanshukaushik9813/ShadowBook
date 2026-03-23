import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';

import { generateProofApi, historyApi, loanCheckApi, verifyProofApi } from '../lib/ghostfiApi';

const DISCLOSURE_FIELDS = [
  { key: 'activityFrequency', label: 'Activity Frequency' },
  { key: 'updatedAt', label: 'Last Updated Time' },
  { key: 'incomeTotal', label: 'Income Total' },
  { key: 'expenseTotal', label: 'Expense Total' },
];

function formatTime(timestamp) {
  if (!timestamp) return '--';
  try {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch (_error) {
    return '--';
  }
}

export default function InstitutionModePanel({ enabled, onToggle, onRevealToAuditor }) {
  const { address } = useAccount();
  const userId = address || 'anonymous';

  const [threshold, setThreshold] = useState(700);
  const [selectedFields, setSelectedFields] = useState({
    activityFrequency: true,
    updatedAt: true,
    incomeTotal: false,
    expenseTotal: false,
  });

  const [latestProof, setLatestProof] = useState(null);
  const [verification, setVerification] = useState(null);
  const [loanDecision, setLoanDecision] = useState(null);
  const [proofHistory, setProofHistory] = useState([]);
  const [loadingAction, setLoadingAction] = useState('');
  const [error, setError] = useState('');

  const revealedFields = useMemo(
    () =>
      Object.entries(selectedFields)
        .filter(([, selected]) => selected)
        .map(([fieldKey]) => fieldKey),
    [selectedFields]
  );

  async function refreshHistory() {
    const result = await historyApi({
      userId,
      limit: 8,
    });
    setProofHistory(result.proofs || []);
  }

  useEffect(() => {
    if (!enabled) return;
    refreshHistory().catch((historyError) => {
      setError(historyError.message);
    });
  }, [enabled, userId]);

  function handleFieldToggle(fieldKey) {
    setSelectedFields((previous) => ({
      ...previous,
      [fieldKey]: !previous[fieldKey],
    }));
  }

  async function handleGenerateProof(isAuditorFlow) {
    try {
      setError('');
      setVerification(null);
      setLoadingAction(isAuditorFlow ? 'auditor' : 'proof');

      const result = await generateProofApi({
        userId,
        type: 'score',
        claim: {
          metric: 'creditScore',
          operator: 'gt',
          value: Number(threshold),
        },
        reveal: revealedFields,
        hide: ['creditScore'],
      });

      setLatestProof(result.proof);
      await refreshHistory();

      if (isAuditorFlow && typeof onRevealToAuditor === 'function') {
        onRevealToAuditor(result.proof);
      }
    } catch (proofError) {
      setError(proofError.message || 'Unable to generate selective proof.');
    } finally {
      setLoadingAction('');
    }
  }

  async function handleLoanCheck() {
    try {
      setError('');
      setLoadingAction('loan');
      const result = await loanCheckApi({
        userId,
        requestedAmount: 3500,
        termMonths: 12,
      });
      setLoanDecision(result.loan);
    } catch (loanError) {
      setError(loanError.message || 'Loan check failed.');
    } finally {
      setLoadingAction('');
    }
  }

  async function handleVerifyLatest() {
    if (!latestProof?.id) return;
    try {
      setError('');
      setLoadingAction('verify');
      const result = await verifyProofApi({
        userId,
        proofId: latestProof.id,
      });
      setVerification(result);
    } catch (verifyError) {
      setError(verifyError.message || 'Proof verification failed.');
    } finally {
      setLoadingAction('');
    }
  }

  return (
    <section className="sb-card relative overflow-hidden">
      <div className="sb-radial-glow -left-8 top-1/2 h-44 w-44 -translate-y-1/2 bg-cyan-300/20" />
      <div className="sb-radial-glow -right-8 top-1/3 h-40 w-40 -translate-y-1/2 bg-emerald-300/20" />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="sb-eyebrow">Institution Mode</p>
          <h3 className="sb-heading-lg mt-2 text-2xl md:text-4xl">
            <span className="sb-subtle-text-gradient">Compliance + Confidentiality</span>
          </h3>
          <p className="mt-2 text-xs uppercase tracking-[0.28em] text-slate-400/80">INSTITUTION MODE</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <button
            type="button"
            className={`relative h-8 w-[62px] rounded-full border p-1 transition-all ${
              enabled
                ? 'border-emerald-300/60 bg-gradient-to-r from-emerald-300/60 to-cyan-300/60 shadow-sbGlow'
                : 'border-slate-500/45 bg-slate-900/60'
            }`}
            onClick={() => onToggle(!enabled)}
            aria-pressed={enabled}
          >
            <motion.span
              className="absolute inset-0 rounded-full"
              initial={false}
              animate={enabled ? { boxShadow: ['0 0 0 rgba(0,0,0,0)', '0 0 20px rgba(0,255,163,0.4)', '0 0 0 rgba(0,0,0,0)'] } : {}}
              transition={{ duration: 0.6 }}
            />
            <motion.span
              className="relative z-[2] block h-6 w-6 rounded-full bg-white/90 shadow-[0_4px_14px_rgba(0,0,0,0.35)]"
              animate={{ x: enabled ? 30 : 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 24 }}
            />
          </button>
          <motion.span
            className={`text-[11px] uppercase tracking-[0.16em] ${enabled ? 'text-emerald-100' : 'text-slate-400'}`}
            initial={false}
            animate={{ opacity: enabled ? 1 : 0.7, textShadow: enabled ? '0 0 14px rgba(0,255,163,0.55)' : 'none' }}
          >
            {enabled ? 'Enabled' : 'Disabled'}
          </motion.span>
        </div>
      </div>

      {enabled ? (
        <div className="relative mt-5 space-y-4">
          <motion.div
            className="absolute right-1 top-0 h-10 w-10 rounded-full border border-cyan-200/40 bg-gradient-to-br from-cyan-200/35 to-slate-900/80 text-center text-lg leading-10 text-cyan-100"
            animate={{ rotate: [0, 360], y: [0, -4, 0] }}
            transition={{ rotate: { duration: 12, repeat: Infinity, ease: 'linear' }, y: { duration: 3.8, repeat: Infinity } }}
            aria-hidden
          >
            Ξ
          </motion.div>

          <motion.span
            className="inline-flex rounded-full border border-emerald-300/45 bg-emerald-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-100"
            animate={{ opacity: [0.9, 1, 0.9] }}
            transition={{ duration: 2.3, repeat: Infinity }}
          >
            Shield Institution Grade Privacy
          </motion.span>

          <p className="sb-muted max-w-xl">
            Selective disclosure enabled. You can prove policy conditions while private values remain hidden.
          </p>

          <div className="grid gap-2">
            <label className="text-xs uppercase tracking-[0.16em] text-slate-400" htmlFor="proof-threshold">
              Prove score greater than
            </label>
            <input
              id="proof-threshold"
              className="sb-input"
              type="number"
              min="300"
              max="900"
              value={threshold}
              onChange={(event) => setThreshold(event.target.value)}
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {DISCLOSURE_FIELDS.map((field) => (
              <label
                key={field.key}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                  selectedFields[field.key]
                    ? 'border-emerald-300/45 bg-emerald-300/10 text-emerald-50'
                    : 'border-cyan-100/15 bg-slate-900/45 text-slate-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={Boolean(selectedFields[field.key])}
                  onChange={() => handleFieldToggle(field.key)}
                />
                <span>{field.label}</span>
              </label>
            ))}
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              className="sb-button-ghost"
              onClick={() => handleGenerateProof(false)}
              disabled={loadingAction !== ''}
            >
              {loadingAction === 'proof' ? 'Generating...' : 'Generate Proof'}
            </button>
            <button
              type="button"
              className="sb-button-ghost border-emerald-300/35 text-emerald-100 hover:shadow-sbGlow"
              onClick={() => handleGenerateProof(true)}
              disabled={loadingAction !== ''}
            >
              {loadingAction === 'auditor' ? 'Decrypting for auditor...' : 'Reveal to Auditor'}
            </button>
            <button
              type="button"
              className="sb-button-ghost"
              onClick={handleLoanCheck}
              disabled={loadingAction !== ''}
            >
              {loadingAction === 'loan' ? 'Checking...' : 'Loan Check'}
            </button>
          </div>

          {latestProof ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-cyan-100/20 bg-slate-900/45 px-3 py-2">
              <p className="font-mono text-xs text-slate-200">
                Latest Proof:
                {' '}
                {latestProof.id}
                {' '}
                |
                {' '}
                {latestProof.type}
                {' '}
                |
                {' '}
                {latestProof.result}
              </p>
              <button
                type="button"
                className="sb-button-ghost py-1.5 text-xs"
                onClick={handleVerifyLatest}
                disabled={loadingAction !== ''}
              >
                {loadingAction === 'verify' ? 'Verifying...' : 'Verify Proof'}
              </button>
            </div>
          ) : null}

          {verification ? (
            <p className="text-sm text-slate-300">
              Verification:
              {' '}
              {verification.status}
              {' '}
              (
              {verification.verified ? 'valid' : 'invalid'}
              )
            </p>
          ) : null}

          {loanDecision ? (
            <p className="text-sm text-slate-300">
              Loan Decision:
              {' '}
              {loanDecision.status}
              {' '}
              |
              {' '}
              Max Eligible:
              {' '}
              {loanDecision.maxEligibleAmount}
            </p>
          ) : null}

          {proofHistory.length ? (
            <ul className="space-y-1.5">
              {proofHistory.map((proof) => (
                <li
                  key={proof.id}
                  className="grid grid-cols-2 gap-2 rounded-xl border border-cyan-100/15 bg-slate-900/45 px-3 py-2 text-xs text-slate-300 sm:grid-cols-4"
                >
                  <span className="font-mono">{proof.id}</span>
                  <span>{proof.type}</span>
                  <span>{proof.result}</span>
                  <span>{formatTime(proof.timestamp)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">No proofs generated yet.</p>
          )}

          {error ? (
            <p className="rounded-lg border border-rose-300/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {error}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-400">
          Enable institution mode to activate compliance controls and selective auditor disclosure.
        </p>
      )}
    </section>
  );
}
