import { motion } from 'framer-motion';

const STAGES = [
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

const DEFAULT_STAGE = {
  state: 'idle',
  label: 'Awaiting input',
};

function formatPayload(stageKey, flowState) {
  const payload = flowState?.[stageKey];
  if (!payload) return null;
  const serialized = JSON.stringify(payload, null, 2);
  return serialized.length > 420 ? `${serialized.slice(0, 420)}\n...` : serialized;
}

function txLabel(status) {
  const value = String(status || 'idle');
  if (value === 'submitted') return 'Submitted';
  if (value === 'pending') return 'Pending';
  if (value === 'confirmed') return 'Confirmed';
  if (value === 'failed') return 'Failed';
  return 'Idle';
}

export default function FlowPipeline({ flowState }) {
  const pipeline = flowState?.pipeline || {};
  const stageMap = pipeline.stages || {};
  const tx = flowState?.tx || {};
  const progress = Number.isFinite(pipeline.progress) ? Math.max(0, Math.min(pipeline.progress, 100)) : 0;
  const hasError = Boolean(pipeline.error);

  return (
    <section className="sb-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="sb-eyebrow">Execution Status</p>
          <h3 className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-white">
            Settlement progress
          </h3>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-medium ${
            tx.status === 'confirmed'
              ? 'border-[#ffb36b]/16 bg-[#ff8a3c]/[0.08] text-[#ffe0c2]'
              : tx.status === 'failed'
                ? 'border-rose-200/20 bg-rose-200/[0.05] text-rose-100'
                : 'border-white/10 bg-white/[0.03] text-slate-200'
          }`}
        >
          {txLabel(tx.status)}
        </span>
      </div>

      <p className={`mt-3 text-sm ${hasError ? 'text-rose-200' : 'text-slate-300'}`}>
        {hasError ? pipeline.error : pipeline.statusMessage || 'Awaiting input'}
      </p>

      <div className="mt-4 h-2 overflow-hidden rounded-full border border-white/10 bg-slate-900/75">
        <motion.span
          className={`block h-full rounded-full ${hasError ? 'bg-rose-300/80' : 'bg-[#ffb36b]/80'}`}
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', stiffness: 110, damping: 20, mass: 0.6 }}
        />
      </div>

      {tx.hash ? (
        <p className="mt-3 break-all font-mono text-xs text-slate-300">
          tx:
          {' '}
          {tx.hash}
          {tx.explorerUrl ? (
            <>
              {' '}
              |
              {' '}
              <a className="text-[#ffd8b2] underline-offset-2 hover:underline" href={tx.explorerUrl} target="_blank" rel="noreferrer">
                View Explorer
              </a>
            </>
          ) : null}
        </p>
      ) : null}

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {STAGES.map((stage, index) => {
          const current = stageMap[stage.key] || DEFAULT_STAGE;
          const payload = formatPayload(stage.key, flowState);
          const isActive = pipeline.currentStage === stage.key || current.state === 'processing';
          const isCompleted = current.state === 'completed';
          const isError = current.state === 'error';

          const colorClass = isCompleted
            ? 'border-[#ffb36b]/16 bg-[#ff8a3c]/[0.08]'
            : isActive
              ? 'border-white/12 bg-white/[0.045]'
              : isError
                ? 'border-rose-200/20 bg-rose-200/[0.05]'
                : 'border-white/8 bg-white/[0.025]';

          return (
            <motion.article
              key={stage.key}
              className={`rounded-2xl border p-4 ${colorClass}`}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ delay: index * 0.06, duration: 0.35 }}
            >
              <div className="flex items-start gap-2">
                <span className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold ${
                  isCompleted ? 'border-[#ffb36b]/18 text-[#ffe0c2]' : 'border-white/20 text-slate-100'
                }`}>
                  {isCompleted ? '✓' : index + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-white">{stage.title}</p>
                  <p className="mt-1 text-xs text-slate-300">{stage.description}</p>
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-500">
                {current.label || (current.state === 'processing' ? 'Processing...' : 'Awaiting input')}
              </p>

              <div className="mt-2 min-h-24 rounded-lg border border-white/10 bg-[rgba(8,7,6,0.5)] p-2">
                {payload ? (
                  <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-slate-200">
                    {payload}
                  </pre>
                ) : (
                  <p className="text-xs text-slate-400">
                    {current.state === 'processing' ? 'Processing...' : 'Awaiting input'}
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
