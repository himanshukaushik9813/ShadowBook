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
    <section className="sb-card">
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="sb-eyebrow">Auditor Access</p>
          <h3 className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-white">
            Controlled disclosure
          </h3>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-400">
            Generate a proof package with limited disclosure when external review is required.
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <button
            type="button"
            className={`relative h-8 w-[62px] rounded-full border p-1 transition-all ${
              enabled
                ? 'border-[#ffb36b]/18 bg-[#ff8a3c]/[0.1] shadow-[0_0_24px_rgba(255,138,60,0.1)]'
                : 'border-white/10 bg-white/[0.03]'
            }`}
            onClick={() => onToggle(!enabled)}
            aria-pressed={enabled}
          >
            <motion.span
              className="relative z-[2] block h-6 w-6 rounded-full bg-white/90 shadow-[0_4px_14px_rgba(0,0,0,0.35)]"
              animate={{ x: enabled ? 30 : 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 24 }}
            />
          </button>
          <span className={`text-xs ${enabled ? 'text-[#ffe0c2]' : 'text-slate-500'}`}>
            {enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>

      {enabled ? (
        <div className="relative mt-5 space-y-4">
          <p className="sb-muted max-w-xl">
            Choose which supporting fields can be included in an auditor-facing proof. Sensitive values remain hidden unless explicitly disclosed.
          </p>

          <div className="grid gap-2">
            <label className="text-xs font-medium text-slate-500" htmlFor="proof-threshold">
              Proof threshold
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
                    ? 'border-[#ffb36b]/18 bg-[#ff8a3c]/[0.08] text-[#ffe0c2]'
                    : 'border-white/10 bg-[rgba(8,7,6,0.42)] text-slate-200'
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
              className="sb-button-ghost"
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
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/8 bg-[rgba(8,7,6,0.42)] px-3 py-2">
              <p className="font-mono text-xs text-slate-200">
                Latest proof:
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
                  className="grid grid-cols-2 gap-2 rounded-xl border border-white/8 bg-[rgba(8,7,6,0.42)] px-3 py-2 text-xs text-slate-300 sm:grid-cols-4"
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
          Enable auditor access to allow limited disclosure when required.
        </p>
      )}
    </section>
  );
}
