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
          <p className="sb-eyebrow">Execution Pipeline</p>
          <h3 className="sb-heading-lg mt-2 text-2xl md:text-3xl">Live Step-by-Step Flow</h3>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
            tx.status === 'confirmed'
              ? 'border-emerald-300/45 bg-emerald-300/10 text-emerald-100'
              : tx.status === 'failed'
                ? 'border-rose-300/45 bg-rose-400/10 text-rose-100'
                : 'border-cyan-200/30 bg-cyan-300/10 text-cyan-100'
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
          className={`block h-full rounded-full ${
            hasError ? 'bg-gradient-to-r from-rose-400 to-orange-300' : 'bg-gradient-to-r from-emerald-300 to-cyan-300'
          }`}
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
              <a className="text-cyan-200 underline-offset-2 hover:underline" href={tx.explorerUrl} target="_blank" rel="noreferrer">
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
            ? 'border-emerald-300/40 bg-emerald-300/10'
            : isActive
              ? 'border-cyan-300/45 bg-cyan-400/10 shadow-sbBlueGlow'
              : isError
                ? 'border-rose-300/45 bg-rose-400/10'
                : 'border-white/10 bg-slate-900/45';

          return (
            <motion.article
              key={stage.key}
              className={`rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-1 ${colorClass}`}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ delay: index * 0.06, duration: 0.35 }}
            >
              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-white/20 text-xs font-semibold text-slate-100">
                  {isCompleted ? '✓' : index + 1}
                </span>
                <div>
                  <p className="sb-eyebrow text-[10px]">{stage.title}</p>
                  <p className="mt-1 text-xs text-slate-300">{stage.description}</p>
                </div>
              </div>

              <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-400">
                {current.label || (current.state === 'processing' ? 'Processing...' : 'Awaiting input')}
              </p>

              <div className="mt-2 min-h-24 rounded-lg border border-white/10 bg-black/25 p-2">
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
