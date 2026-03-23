import { motion } from 'framer-motion';

const stages = [
  {
    key: 'plaintext',
    title: 'Plaintext',
    description: 'Input values captured on client',
  },
  {
    key: 'encrypted',
    title: 'Encrypted',
    description: 'CoFHE ciphertext generated',
  },
  {
    key: 'matched',
    title: 'Matched',
    description: 'Private matching computed on-chain',
  },
  {
    key: 'decrypted',
    title: 'Decrypted',
    description: 'Execution output unsealed locally',
  },
];

const STAGE_STATE_DEFAULT = {
  state: 'idle',
  label: 'Awaiting input',
};

function formatPayload(stageKey, flowState) {
  const payload = flowState?.[stageKey];
  if (!payload) return null;

  const serialized = JSON.stringify(payload, null, 2);
  return serialized.length > 450 ? `${serialized.slice(0, 450)}\n...` : serialized;
}

function getTxStatusLabel(txStatus) {
  const value = String(txStatus || 'idle');
  if (value === 'idle') return 'Idle';
  if (value === 'submitted') return 'Submitted';
  if (value === 'pending') return 'Pending';
  if (value === 'confirmed') return 'Confirmed';
  if (value === 'failed') return 'Failed';
  return value;
}

export default function FlowPipeline({ flowState }) {
  const pipeline = flowState?.pipeline || {};
  const stageStateMap = pipeline.stages || {};
  const tx = flowState?.tx || {};
  const progress = Number.isFinite(pipeline.progress) ? pipeline.progress : 0;
  const hasError = Boolean(pipeline.error);

  return (
    <section className="glass card pipeline-shell">
      <div className="pipeline-head-row">
        <div>
          <p className="eyebrow">Execution Pipeline</p>
          <h3>Live Step-by-Step Flow</h3>
        </div>
        <span className={`pipeline-tx-chip ${tx.status || 'idle'}`}>
          {getTxStatusLabel(tx.status)}
        </span>
      </div>

      <p className={`pipeline-status-text ${hasError ? 'error' : ''}`}>
        {hasError ? pipeline.error : pipeline.statusMessage || 'Awaiting input'}
      </p>

      <div className="pipeline-progress-track" aria-label="Pipeline progress">
        <motion.span
          className={`pipeline-progress-value ${hasError ? 'error' : ''}`}
          initial={false}
          animate={{ width: `${Math.max(0, Math.min(progress, 100))}%` }}
          transition={{ type: 'spring', stiffness: 110, damping: 20, mass: 0.6 }}
        />
      </div>

      {tx.hash ? (
        <p className="pipeline-tx-line small mono">
          tx: {tx.hash}
          {tx.explorerUrl ? (
            <>
              {' '}|{' '}
              <a href={tx.explorerUrl} target="_blank" rel="noreferrer">
                View Explorer
              </a>
            </>
          ) : null}
        </p>
      ) : null}

      <div className="pipeline-steps-grid">
        {stages.map((stage, index) => {
          const stageState = stageStateMap[stage.key] || STAGE_STATE_DEFAULT;
          const stagePayload = formatPayload(stage.key, flowState);
          const isActive =
            pipeline.currentStage === stage.key || stageState.state === 'processing';
          const isCompleted = stageState.state === 'completed';
          const isErrored = stageState.state === 'error';

          return (
            <motion.article
              key={stage.key}
              className={[
                'pipeline-stage-card',
                isActive ? 'active' : '',
                isCompleted ? 'completed' : '',
                isErrored ? 'error' : '',
              ]
                .join(' ')
                .trim()}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: index * 0.08, duration: 0.38 }}
            >
              <div className="pipeline-stage-head">
                <span className={`stage-dot ${stageState.state}`}>
                  {isCompleted ? '✓' : index + 1}
                </span>
                <div>
                  <p className="eyebrow">{stage.title}</p>
                  <p className="muted small">{stage.description}</p>
                </div>
              </div>

              <p className={`pipeline-stage-label ${stageState.state}`}>
                {stageState.label || (stageState.state === 'processing' ? 'Processing...' : 'Awaiting input')}
              </p>

              <div className="pipeline-stage-data">
                {stagePayload ? (
                  <pre>{stagePayload}</pre>
                ) : (
                  <p className="muted small">
                    {stageState.state === 'processing' ? 'Processing...' : 'Awaiting input'}
                  </p>
                )}
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
