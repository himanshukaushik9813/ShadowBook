import { motion } from 'framer-motion';

const STEP_CONFIG = [
  {
    key: 'plaintext',
    label: 'INPUT',
    title: 'Order captured',
    hint: 'Collecting local intent',
  },
  {
    key: 'encrypted',
    label: 'ENCRYPT',
    title: 'Ciphertext generated',
    hint: 'Sealing price and amount',
  },
  {
    key: 'submitted',
    label: 'ROUTE',
    title: 'Escrow committed',
    hint: 'Sending through secure routing',
  },
  {
    key: 'matching',
    label: 'EXECUTE',
    title: 'Searching private liquidity',
    hint: 'Evaluating counterparties',
  },
  {
    key: 'decrypted',
    label: 'SETTLE',
    title: 'Settlement revealed',
    hint: 'Owner-side result only',
  },
];

const DEFAULT_STAGE = {
  state: 'idle',
  label: 'Awaiting input',
};

function txLabel(status) {
  const value = String(status || 'idle').toLowerCase();
  if (value === 'submitted') return 'Submitted';
  if (value === 'pending') return 'Pending';
  if (value === 'confirmed') return 'Confirmed';
  if (value === 'matching') return 'Matching';
  if (value === 'matched') return 'Confirmed';
  if (value === 'open') return 'Open in book';
  if (value === 'cancelled') return 'Cancelled';
  if (value === 'failed') return 'Failed';
  return 'Awaiting submission';
}

function shortHash(value) {
  if (!value) return '--';
  const text = String(value);
  return text.length <= 18 ? text : `${text.slice(0, 10)}...${text.slice(-6)}`;
}

function getProcessingHint(activeKey, txStatus) {
  if (txStatus === 'pending') return 'Waiting for Helium confirmation';
  if (txStatus === 'confirmed') return 'Receipt confirmed on-chain';
  if (activeKey === 'plaintext') return 'Ready for encrypted submission';
  if (activeKey === 'encrypted') return 'Generating CoFHE ciphertexts';
  if (activeKey === 'submitted') return 'Posting escrow and ciphertext handles';
  if (activeKey === 'matching') return 'Routing through private liquidity search';
  if (activeKey === 'decrypted') return 'Preparing owner-side reveal';
  return 'Pipeline standing by';
}

function resolveStepStates(stageMap, currentStage) {
  const activeIndex = Math.max(
    0,
    STEP_CONFIG.findIndex((step) => step.key === currentStage)
  );

  return STEP_CONFIG.map((step, index) => {
    const raw = stageMap[step.key] || DEFAULT_STAGE;
    const explicitCompleted = raw.state === 'completed';
    const explicitProcessing = raw.state === 'processing';
    const explicitError = raw.state === 'error';

    let state = 'pending';

    if (explicitCompleted || index < activeIndex) {
      state = 'completed';
    } else if (explicitError || explicitProcessing || step.key === currentStage) {
      state = 'active';
    }

    return {
      ...step,
      state,
      statusLabel: raw.label || step.hint,
      hasError: explicitError,
    };
  });
}

function DesktopStep({ step }) {
  const completed = step.state === 'completed';
  const active = step.state === 'active';
  const pending = step.state === 'pending';

  return (
    <div className={`relative min-w-0 ${pending ? 'opacity-60' : ''}`}>
      <div className="relative flex flex-col items-center text-center">
        <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.14em] text-white/50">{step.label}</p>

        <div className="relative z-[1]">
          <span
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border text-[11px] font-semibold ${
              completed
                ? 'border-[#ffb36b]/18 bg-[#ff8a3c]/[0.08] text-[#ffe0c2]'
                : active
                  ? 'border-white/14 bg-white/[0.05] text-white'
                  : 'border-white/10 bg-white/[0.02] text-white/50'
            }`}
          >
            {completed ? '✓' : step.label.slice(0, 1)}
          </span>
          {active ? (
            <motion.span
              className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#ffb36b]/18"
              animate={{ scale: [1, 1.14, 1], opacity: [0.3, 0.08, 0.3] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />
          ) : null}
        </div>

        <div className="mt-4 max-w-[170px]">
          <p className="text-sm font-medium text-white">{step.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-white/70">{step.statusLabel}</p>
        </div>
      </div>
    </div>
  );
}

function MobileStep({ step, index, isLast }) {
  const completed = step.state === 'completed';
  const active = step.state === 'active';
  const pending = step.state === 'pending';

  return (
    <div className={`grid grid-cols-[auto_1fr] gap-4 ${pending ? 'opacity-60' : ''}`}>
      <div className="flex w-8 flex-col items-center">
        <span
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-[11px] font-semibold ${
            completed
              ? 'border-[#ffb36b]/18 bg-[#ff8a3c]/[0.08] text-[#ffe0c2]'
              : active
                ? 'border-white/14 bg-white/[0.05] text-white'
                : 'border-white/10 bg-white/[0.02] text-white/50'
          }`}
        >
          {completed ? '✓' : index + 1}
        </span>
        {active ? (
          <motion.span
            className="mt-[-32px] h-8 w-8 rounded-full border border-[#ffb36b]/18"
            animate={{ scale: [1, 1.14, 1], opacity: [0.28, 0.08, 0.28] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        ) : null}
        {!isLast ? <span className="mt-2 h-full w-px bg-white/10" /> : null}
      </div>

      <div className="pb-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/50">{step.label}</p>
        <p className="mt-2 text-sm font-medium text-white">{step.title}</p>
        <p className="mt-1 text-sm leading-relaxed text-white/70">{step.statusLabel}</p>
      </div>
    </div>
  );
}

export default function FlowPipeline({ flowState }) {
  const pipeline = flowState?.pipeline || {};
  const tx = flowState?.tx || {};
  const progress = Number.isFinite(pipeline.progress)
    ? Math.max(0, Math.min(pipeline.progress, 100))
    : 0;
  const stageMap = pipeline.stages || {};
  const currentStage = pipeline.currentStage || 'plaintext';
  const steps = resolveStepStates(stageMap, currentStage);
  const activeStep = steps.find((step) => step.state === 'active') || steps.find((step) => step.state === 'pending') || steps[steps.length - 1];
  const hasError = Boolean(pipeline.error);

  return (
    <section className="sb-card-primary space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="sb-eyebrow">Encrypted pipeline</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Live execution pipeline</h3>
        </div>
        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/70">
          Private execution
        </span>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-5">
        <div className="relative hidden md:block">
          <div className="absolute left-[10%] right-[10%] top-[44px] h-px bg-white/10" />
          <div className="absolute left-[10%] right-[10%] top-[44px] h-px bg-gradient-to-r from-[#ffb36b]/30 via-white/10 to-[#ffb36b]/30" />

          <div className="grid grid-cols-5 gap-0">
            {steps.map((step) => (
              <DesktopStep key={step.key} step={step} />
            ))}
          </div>
        </div>

        <div className="space-y-4 md:hidden">
          {steps.map((step, index) => (
            <MobileStep
              key={step.key}
              step={step}
              index={index}
              isLast={index === steps.length - 1}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3 text-xs text-white/50">
          <span>Pipeline completion</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full border border-white/10 bg-white/[0.03]">
          <motion.span
            className={`block h-full rounded-full ${hasError ? 'bg-rose-300/80' : 'bg-[#ffb36b]/80'}`}
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 110, damping: 20, mass: 0.6 }}
          />
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-white/50">Status</p>
            <p className="mt-2 text-sm text-white">
              {hasError ? pipeline.error : pipeline.statusMessage || activeStep?.title || 'Awaiting input'}
            </p>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-white/50">Tx</p>
            <p className="mt-2 text-sm text-white">{txLabel(tx.status)}</p>
            {tx.hash ? <p className="mt-1 font-mono text-xs text-white/50">{shortHash(tx.hash)}</p> : null}
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-white/50">Processing</p>
            <p className="mt-2 text-sm text-white">{getProcessingHint(activeStep?.key, tx.status)}</p>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-white/50">Privacy</p>
            <p className="mt-2 text-sm text-white">Encrypted end-to-end</p>
            <p className="mt-1 text-xs text-white/50">Visible only after owner-side reveal</p>
          </div>
        </div>
      </div>
    </section>
  );
}
