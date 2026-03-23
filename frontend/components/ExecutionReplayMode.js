import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

const FALLBACK_STEPS = [
  { key: 'plaintext', title: 'Plaintext Order', description: 'Capture user intent before encryption.' },
  { key: 'encrypted', title: 'Encryption Transform', description: 'Convert values into CoFHE ciphertexts.' },
  { key: 'submitted', title: 'On-chain Submission', description: 'Broadcast encrypted order transaction.' },
  { key: 'matched', title: 'Private Matching', description: 'Evaluate matching logic over encrypted data.' },
  { key: 'decrypted', title: 'Result Decryption', description: 'Decrypt execution result client-side.' },
];

function shortJson(value) {
  if (!value) return 'No payload captured';
  const serialized = JSON.stringify(value);
  return serialized.length > 120 ? `${serialized.slice(0, 120)}...` : serialized;
}

export default function ExecutionReplayMode({ flowState }) {
  const replay = flowState?.replay || { steps: [], canReplay: false };
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const steps = useMemo(() => {
    if (replay.steps?.length) return replay.steps;
    return FALLBACK_STEPS.map((step) => ({ ...step, data: null }));
  }, [replay.steps]);

  useEffect(() => {
    if (!isPlaying) return undefined;
    const timer = setInterval(() => {
      setActiveIndex((previous) => {
        if (previous >= steps.length - 1) {
          setIsPlaying(false);
          return previous;
        }
        return previous + 1;
      });
    }, 1300);
    return () => clearInterval(timer);
  }, [isPlaying, steps.length]);

  function startReplay() {
    setActiveIndex(0);
    setIsPlaying(true);
  }

  function togglePlayback() {
    if (!replay.canReplay) return;
    if (!isPlaying && activeIndex >= steps.length - 1) {
      setActiveIndex(0);
    }
    setIsPlaying((previous) => !previous);
  }

  return (
    <section className="glass card replay-card">
      <div className="replay-head">
        <div>
          <p className="eyebrow">Encryption Replay Mode</p>
          <h3>Replay Execution Timeline</h3>
        </div>

        <div className="replay-controls">
          <button type="button" className="btn secondary" disabled={!replay.canReplay} onClick={startReplay}>
            Replay Execution
          </button>
          <button type="button" className="btn secondary" disabled={!replay.canReplay} onClick={togglePlayback}>
            {isPlaying ? 'Pause' : 'Play'}
          </button>
        </div>
      </div>

      {!replay.canReplay ? (
        <p className="muted small">
          Complete one encrypted order cycle to unlock replay controls and step-by-step execution playback.
        </p>
      ) : null}

      <div className="replay-timeline">
        {steps.map((step, index) => {
          const isCompleted = index < activeIndex || (!isPlaying && replay.canReplay && index <= activeIndex);
          const isActive = index === activeIndex;

          return (
            <motion.article
              key={step.key || `${step.title}-${index}`}
              className={`replay-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
              initial={{ opacity: 0.58, y: 10 }}
              animate={{ opacity: isActive ? 1 : 0.72, y: 0 }}
              transition={{ duration: 0.26 }}
            >
              <div className="replay-step-marker">
                <span>{isCompleted ? '✓' : index + 1}</span>
              </div>
              <div className="replay-step-content">
                <p className="replay-step-title">{step.title}</p>
                <p className="muted small">{step.description}</p>
                <p className="replay-step-payload mono">{shortJson(step.data)}</p>
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}

