import { useEffect, useMemo, useState } from 'react';
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
    <section className="glass card institution-card">
      <div className="institution-top">
        <div>
          <p className="eyebrow">Adoption Layer</p>
          <h3>Compliance + Confidentiality</h3>
          <p className="institution-mode-label">Institution Mode</p>
        </div>

        <div className="institution-toggle-wrap">
          <button
            type="button"
            className={`switch ${enabled ? 'on' : ''}`}
            onClick={() => onToggle(!enabled)}
            aria-pressed={enabled}
          >
            <span className="switch-ripple" />
            <span className="switch-knob" />
          </button>
          <span className={`switch-state-label ${enabled ? 'on' : ''}`}>
            {enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>

      {enabled ? (
        <div className="institution-content">
          <div className="institution-coin" aria-hidden>
            Ξ
          </div>
          <div className="institution-badge">Institution Grade Privacy</div>
          <p className="muted small">
            Selective disclosure is enabled. You can prove policy conditions while hiding private raw values.
          </p>

          <div className="proof-controls">
            <label className="small muted" htmlFor="proof-threshold">
              Prove: score greater than
            </label>
            <input
              id="proof-threshold"
              type="number"
              min="300"
              max="900"
              value={threshold}
              onChange={(event) => setThreshold(event.target.value)}
            />
          </div>

          <div className="disclosure-field-grid">
            {DISCLOSURE_FIELDS.map((field) => (
              <label key={field.key} className={`field-chip ${selectedFields[field.key] ? 'active' : ''}`}>
                <input
                  type="checkbox"
                  checked={Boolean(selectedFields[field.key])}
                  onChange={() => handleFieldToggle(field.key)}
                />
                <span>{field.label}</span>
              </label>
            ))}
          </div>

          <div className="institution-actions-row">
            <button
              type="button"
              className="btn secondary"
              onClick={() => handleGenerateProof(false)}
              disabled={loadingAction !== ''}
            >
              {loadingAction === 'proof' ? 'Generating...' : 'Generate Proof'}
            </button>
            <button
              type="button"
              className="btn secondary"
              onClick={() => handleGenerateProof(true)}
              disabled={loadingAction !== ''}
            >
              {loadingAction === 'auditor' ? 'Decrypting for auditor...' : 'Reveal to Auditor'}
            </button>
            <button
              type="button"
              className="btn secondary"
              onClick={handleLoanCheck}
              disabled={loadingAction !== ''}
            >
              {loadingAction === 'loan' ? 'Checking...' : 'Loan Check'}
            </button>
          </div>

          {latestProof ? (
            <div className="institution-proof-preview">
              <p className="small muted mono">
                Latest Proof: {latestProof.id} | {latestProof.type} | {latestProof.result}
              </p>
              <button
                type="button"
                className="btn secondary"
                onClick={handleVerifyLatest}
                disabled={loadingAction !== ''}
              >
                {loadingAction === 'verify' ? 'Verifying...' : 'Verify Proof'}
              </button>
            </div>
          ) : null}

          {verification ? (
            <p className="small muted">
              Verification: {verification.status} ({verification.verified ? 'valid' : 'invalid'})
            </p>
          ) : null}

          {loanDecision ? (
            <p className="small muted">
              Loan Decision: {loanDecision.status} | Max Eligible: {loanDecision.maxEligibleAmount}
            </p>
          ) : null}

          {proofHistory.length ? (
            <ul className="proof-history-list">
              {proofHistory.map((proof) => (
                <li key={proof.id}>
                  <span className="mono">{proof.id}</span>
                  <span>{proof.type}</span>
                  <span>{proof.result}</span>
                  <span>{formatTime(proof.timestamp)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="small muted">No proofs generated yet.</p>
          )}

          {error ? <p className="error-text">{error}</p> : null}
        </div>
      ) : (
        <p className="muted small">
          Enable institution mode to display compliance controls and auditor reveal path.
        </p>
      )}
    </section>
  );
}
