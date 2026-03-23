import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const STAGE_ORDER = ['plaintext', 'encrypted', 'matched', 'decrypted'];

function now() {
  return Date.now();
}

function formatTime(value) {
  try {
    return new Date(value).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch (_error) {
    return '--:--:--';
  }
}

function serializePayload(value) {
  if (!value) return '';
  const serialized = JSON.stringify(value);
  return serialized.length > 96 ? `${serialized.slice(0, 96)}...` : serialized;
}

function buildStageSummary(flowState) {
  const stages = flowState?.pipeline?.stages || {};
  return STAGE_ORDER.map((stageKey) => {
    const stage = stages[stageKey] || { state: 'idle', label: 'Awaiting input' };
    return {
      key: stageKey,
      state: stage.state || 'idle',
      label:
        stage.label ||
        (stage.state === 'processing'
          ? 'Processing...'
          : stage.state === 'completed'
            ? 'Completed'
            : 'Awaiting input'),
      payload: flowState?.[stageKey] || null,
    };
  });
}

function toLogEntry(signature, message, phase = 'info') {
  return {
    id: `${signature}-${Date.now()}`,
    signature,
    message,
    phase,
    timestamp: now(),
  };
}

export default function ExecutionReplayMode({ flowState }) {
  const timelineRef = useRef(null);
  const [logs, setLogs] = useState([
    toLogEntry('init', 'Awaiting input. Execution timeline idle.', 'info'),
  ]);
  const [typing, setTyping] = useState('');

  const pipeline = flowState?.pipeline || {};
  const stageSummary = useMemo(() => buildStageSummary(flowState), [flowState]);
  const tx = flowState?.tx || {};

  useEffect(() => {
    const signature = [
      pipeline.currentStage || 'idle',
      pipeline.statusMessage || 'Awaiting input',
      pipeline.error || '',
      tx.status || 'idle',
      tx.hash || '',
      stageSummary.map((stage) => `${stage.key}:${stage.state}`).join('|'),
    ].join('::');

    const stageText = stageSummary
      .map((stage) => `${stage.key}:${stage.state === 'idle' ? 'awaiting' : stage.state}`)
      .join(' | ');
    const primary =
      pipeline.error ||
      pipeline.statusMessage ||
      (pipeline.currentStage ? `${pipeline.currentStage} processing` : 'Awaiting input');
    const message = `${primary}. ${stageText}.`;

    setLogs((previous) => {
      const has = previous.some((item) => item.signature === signature);
      if (has) return previous;

      const phase = pipeline.error
        ? 'error'
        : tx.status === 'confirmed'
          ? 'success'
          : tx.status === 'failed'
            ? 'error'
            : pipeline.currentStage === 'encrypted' || pipeline.currentStage === 'matched'
              ? 'processing'
              : 'info';

      return [toLogEntry(signature, message, phase), ...previous].slice(0, 12);
    });
  }, [pipeline.currentStage, pipeline.error, pipeline.statusMessage, tx.hash, tx.status, stageSummary]);

  useEffect(() => {
    const latest = logs[0]?.message || '';
    if (!latest) return undefined;
    let index = 0;
    setTyping('');

    const timer = setInterval(() => {
      index += 1;
      setTyping(latest.slice(0, index));
      if (index >= latest.length) {
        clearInterval(timer);
      }
    }, 10);

    return () => clearInterval(timer);
  }, [logs]);

  useEffect(() => {
    if (!timelineRef.current) return;
    timelineRef.current.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, [logs]);

  const progress = Number.isFinite(pipeline.progress) ? Math.min(Math.max(pipeline.progress, 0), 100) : 0;
  const hasError = Boolean(pipeline.error);

  return (
    <section className="sb-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="sb-eyebrow">Execution Timeline</p>
          <h3 className="sb-heading-lg mt-2 text-2xl md:text-3xl">Live Private Execution Logs</h3>
          <p className="sb-muted mt-2">Plaintext captured → encrypted → matched → decrypted</p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
            hasError
              ? 'border-rose-300/40 bg-rose-500/10 text-rose-200'
              : tx.status === 'confirmed'
                ? 'border-emerald-300/45 bg-emerald-400/10 text-emerald-100'
                : 'border-cyan-200/30 bg-cyan-400/10 text-cyan-100'
          }`}
        >
          {tx.status || 'idle'}
        </span>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-300">
          <span>Execution Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full border border-white/10 bg-slate-900/70">
          <motion.div
            className={`h-full rounded-full ${hasError ? 'bg-gradient-to-r from-rose-400 to-orange-300' : 'bg-gradient-to-r from-emerald-300 to-cyan-300'}`}
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-4">
        {stageSummary.map((stage, index) => {
          const stateClass =
            stage.state === 'completed'
              ? 'border-emerald-300/40 bg-emerald-300/10'
              : stage.state === 'processing'
                ? 'border-cyan-300/45 bg-cyan-400/10'
                : stage.state === 'error'
                  ? 'border-rose-300/45 bg-rose-400/10'
                  : 'border-white/10 bg-slate-900/45';

          const indicator =
            stage.state === 'completed' ? '✓' : stage.state === 'processing' ? '•' : stage.state === 'error' ? '!' : index + 1;

          return (
            <motion.article
              key={stage.key}
              className={`rounded-2xl border p-3 transition-all ${stateClass}`}
              initial={{ opacity: 0.7, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/20 text-xs font-semibold text-slate-100">
                  {indicator}
                </span>
                <p className="sb-eyebrow text-[10px]">{stage.key}</p>
              </div>
              <p className="mt-2 text-sm text-slate-200">{stage.label}</p>
              <p className="mt-2 rounded-lg border border-white/10 bg-black/25 px-2 py-1 font-mono text-[11px] text-slate-300">
                {serializePayload(stage.payload) || (stage.state === 'processing' ? 'Processing...' : 'Awaiting input')}
              </p>
            </motion.article>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-cyan-100/20 bg-slate-950/55 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">System Console</p>
          <p className="text-xs text-slate-500">{formatTime(logs[0]?.timestamp)}</p>
        </div>

        <p className="mb-3 font-mono text-sm text-cyan-100">
          {typing}
          <span className="ml-1 animate-pulse">_</span>
        </p>

        <div
          ref={timelineRef}
          className="max-h-52 space-y-2 overflow-y-auto pr-1"
        >
          {logs.map((entry) => (
            <div
              key={entry.id}
              className={`rounded-lg border px-3 py-2 text-xs ${
                entry.phase === 'error'
                  ? 'border-rose-300/35 bg-rose-500/10 text-rose-100'
                  : entry.phase === 'success'
                    ? 'border-emerald-300/35 bg-emerald-500/10 text-emerald-100'
                    : entry.phase === 'processing'
                      ? 'border-cyan-300/35 bg-cyan-500/10 text-cyan-100'
                      : 'border-slate-500/30 bg-slate-800/35 text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] text-slate-400">{formatTime(entry.timestamp)}</span>
                <span className="text-[10px] uppercase tracking-[0.15em]">{entry.phase}</span>
              </div>
              <p className="mt-1 leading-relaxed">{entry.message}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
