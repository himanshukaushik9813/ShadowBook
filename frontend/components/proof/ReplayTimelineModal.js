import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const FALLBACK_STEPS = [
  { key: 'input', title: 'Input captured', description: 'Order intent received from user', data: null },
  { key: 'encrypt', title: 'Encrypted', description: 'Ciphertext generated on client', data: null },
  { key: 'submit', title: 'Submitted', description: 'Transaction sent to chain', data: null },
  { key: 'match', title: 'Matched privately', description: 'Encrypted order matching executed', data: null },
  { key: 'decrypt', title: 'Decrypted', description: 'Result decrypted on authorized client', data: null },
];

function trimData(data) {
  if (!data) return 'Awaiting payload';
  const serialized = JSON.stringify(data);
  return serialized.length > 94 ? `${serialized.slice(0, 94)}...` : serialized;
}

export default function ReplayTimelineModal({ open, onClose, steps }) {
  const timelineSteps = steps?.length ? steps : FALLBACK_STEPS;
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    setActive(0);
    setPlaying(true);
    return undefined;
  }, [open]);

  useEffect(() => {
    if (!open || !playing) return undefined;
    const timer = setInterval(() => {
      setActive((previous) => {
        if (previous >= timelineSteps.length - 1) {
          setPlaying(false);
          return previous;
        }
        return previous + 1;
      });
    }, 1100);
    return () => clearInterval(timer);
  }, [open, playing, timelineSteps.length]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/75 px-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-3xl rounded-3xl border border-cyan-200/25 bg-slate-950/85 p-6 shadow-[0_28px_70px_rgba(0,0,0,0.55)]"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.24 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="sb-eyebrow">Replay Execution</p>
                <h3 className="sb-heading-lg mt-2 text-2xl md:text-3xl">Cryptographic Timeline Playback</h3>
              </div>
              <button type="button" className="h-10 w-10 rounded-xl border border-white/20 text-xl text-slate-300 hover:text-white" onClick={onClose}>
                ×
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {timelineSteps.map((step, index) => {
                const isCompleted = index < active;
                const isActive = index === active;

                return (
                  <motion.article
                    key={step.key || `${step.title}-${index}`}
                    className={`grid grid-cols-[auto_1fr] gap-3 rounded-2xl border p-3 ${
                      isActive
                        ? 'border-cyan-300/55 bg-cyan-400/10'
                        : isCompleted
                          ? 'border-emerald-300/45 bg-emerald-400/10'
                          : 'border-white/10 bg-slate-900/45'
                    }`}
                    initial={{ opacity: 0.75, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 text-xs font-semibold text-slate-100">
                      {isCompleted ? '✓' : index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{step.title}</p>
                      <p className="text-xs text-slate-300">{step.description}</p>
                      <p className="mt-1 rounded-lg border border-white/10 bg-black/25 px-2 py-1 font-mono text-[11px] text-slate-300">
                        {trimData(step.data)}
                      </p>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
