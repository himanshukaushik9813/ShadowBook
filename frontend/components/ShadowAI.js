import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAccount } from 'wagmi';

import { chatApi } from '../lib/ghostfiApi';

const QUICK_PROMPTS = ['Try placing a trade', 'View encrypted proof', 'status', 'last tx', 'encryption info'];

function formatTime(ts) {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch (_error) {
    return '--:--';
  }
}

function getShortHash(hash) {
  if (!hash) return '--';
  const text = String(hash);
  if (text.length <= 18) return text;
  return `${text.slice(0, 10)}...${text.slice(-6)}`;
}

function createMessage(role, text, phase = 'info') {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    role,
    text,
    phase,
    timestamp: Date.now(),
  };
}

function getStageSummary(flowState) {
  const stages = flowState?.pipeline?.stages || {};
  return ['plaintext', 'encrypted', 'matched', 'decrypted']
    .map((key) => `${key}:${stages[key]?.state || 'idle'}`)
    .join(' | ');
}

function resolveCommand(input, flowState, actionText) {
  const normalized = String(input || '').trim().toLowerCase();
  if (!normalized) return null;

  if (normalized === 'status') {
    const stage = flowState?.pipeline?.currentStage || 'idle';
    const txStatus = flowState?.tx?.status || 'idle';
    const msg = flowState?.pipeline?.statusMessage || actionText || 'Awaiting input.';
    return `System status: stage=${stage}, tx=${txStatus}. ${msg}`;
  }

  if (normalized === 'last tx' || normalized === 'last transaction') {
    const hash = flowState?.tx?.hash;
    if (!hash) return 'No transaction yet. Submit an encrypted order to start telemetry.';
    return `Last tx: ${hash}. Explorer: ${flowState?.tx?.explorerUrl || 'Unavailable'}`;
  }

  if (normalized === 'encryption info') {
    if (!flowState?.encrypted) {
      return 'No encrypted payload yet. Submit an order first.';
    }
    return `Encryption info: priceCt=${getShortHash(flowState.encrypted.priceCtHash)}, amountCt=${getShortHash(flowState.encrypted.amountCtHash)}. ${getStageSummary(flowState)}`;
  }

  if (normalized === 'try placing a trade') {
    return 'Enter price and amount, then click Encrypt & Submit Order. I will stream each stage live.';
  }

  if (normalized === 'view encrypted proof') {
    return 'Open the Proof of Encryption panel to inspect plaintext, ciphertext, and on-chain hash proof.';
  }

  return null;
}

export default function ShadowAI({ actionText, logs, institutionMode, flowState }) {
  const { address } = useAccount();
  const userId = address || 'anonymous';

  const threadRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [lastInteractionAt, setLastInteractionAt] = useState(Date.now());
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [error, setError] = useState('');
  const [messages, setMessages] = useState(() => [
    createMessage('bot', 'Shadow AI online. I monitor encryption, transaction state, and private matching in real time.'),
  ]);
  const [lastSignature, setLastSignature] = useState('');

  const latestLogs = useMemo(() => logs.slice(0, 6), [logs]);

  function markInteraction() {
    setLastInteractionAt(Date.now());
  }

  useEffect(() => {
    if (!expanded || isLoading) return undefined;
    const timeout = setTimeout(() => setExpanded(false), 7000);
    return () => clearTimeout(timeout);
  }, [expanded, isLoading, lastInteractionAt]);

  useEffect(() => {
    if (!threadRef.current) return;
    threadRef.current.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typingText]);

  useEffect(() => {
    const signature = [
      flowState?.pipeline?.currentStage || 'idle',
      flowState?.pipeline?.statusMessage || '',
      flowState?.tx?.status || 'idle',
      flowState?.tx?.hash || '',
      actionText || '',
    ].join('::');

    if (!actionText || signature === lastSignature) return;
    setLastSignature(signature);

    const stage = flowState?.pipeline?.currentStage;
    const txStatus = flowState?.tx?.status;
    let text = actionText;
    if (stage === 'encrypted') text = 'Order encrypted successfully. Ciphertext ready for chain submission.';
    if (txStatus === 'pending') text = 'Transaction submitted. Waiting for secure confirmation.';
    if (stage === 'matched') text = 'Private matching in progress. No MEV risk detected.';
    if (stage === 'decrypted') text = 'Result decrypted locally. Execution remained private end to end.';
    if (txStatus === 'failed') text = 'Execution hit an error. I can help diagnose using status command.';

    setMessages((previous) => [...previous, createMessage('bot', text, txStatus === 'failed' ? 'error' : 'info')].slice(-28));
  }, [
    actionText,
    flowState?.pipeline?.currentStage,
    flowState?.pipeline?.statusMessage,
    flowState?.tx?.status,
    flowState?.tx?.hash,
    lastSignature,
  ]);

  async function typeReply(text) {
    const source = String(text || '');
    let index = 0;
    setTypingText('');
    while (index < source.length) {
      index += 1;
      setTypingText(source.slice(0, index));
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  async function sendMessage(prompt) {
    const content = String(prompt || '').trim();
    if (!content || isLoading) return;
    markInteraction();
    setError('');
    setInputValue('');
    setMessages((previous) => [...previous, createMessage('user', content)].slice(-28));
    setIsLoading(true);

    try {
      const commandReply = resolveCommand(content, flowState, actionText);
      const replyText = commandReply
        ? commandReply
        : (await chatApi({
            userId,
            message: content,
          })).reply;

      await typeReply(replyText);
      setMessages((previous) => [...previous, createMessage('bot', replyText)].slice(-28));
      setTypingText('');
    } catch (chatError) {
      setTypingText('');
      setError(chatError.message || 'Unable to get response.');
      setMessages((previous) => [...previous, createMessage('bot', 'Secure AI channel unavailable. Please retry.', 'error')].slice(-28));
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage(inputValue);
  }

  return (
    <aside className="fixed bottom-5 right-4 z-[95] w-[min(420px,calc(100vw-20px))]">
      <motion.div
        className="sb-glass overflow-hidden border-cyan-200/25 bg-slate-950/70 shadow-[0_22px_55px_rgba(0,0,0,0.48)]"
        initial={false}
        animate={{ opacity: 1 }}
      >
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-left"
          onClick={() => {
            setExpanded((previous) => !previous);
            markInteraction();
          }}
        >
          <div className="flex items-center gap-3">
            <div className="relative grid h-10 w-10 place-items-center rounded-full border border-emerald-300/40 bg-emerald-300/10">
              <motion.span
                className="absolute h-8 w-8 rounded-full border border-emerald-300/50"
                animate={{ scale: [1, 1.35], opacity: [0.7, 0] }}
                transition={{ duration: 1.9, repeat: Infinity, ease: 'easeOut' }}
              />
              <span className="h-3 w-3 rounded-full bg-emerald-300 shadow-sbGlow" />
            </div>
            <div>
              <p className="sb-eyebrow text-[10px]">Shadow AI</p>
              <p className="text-sm font-semibold text-slate-100">Encrypted System Assistant</p>
            </div>
          </div>
          <div className="text-xs text-slate-400">{expanded ? 'Collapse' : 'Open'}</div>
        </button>

        <AnimatePresence initial={false}>
          {expanded ? (
            <motion.div
              className="space-y-3 px-4 py-3"
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onMouseMove={markInteraction}
            >
              <div className="rounded-xl border border-cyan-100/20 bg-slate-900/55 px-3 py-2">
                <p className="text-sm text-cyan-100">{actionText || 'Monitoring private execution...'}</p>
                {institutionMode ? (
                  <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-emerald-200/90">Institution Grade Privacy Active</p>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="rounded-full border border-cyan-200/25 bg-slate-900/45 px-3 py-1.5 text-xs text-slate-200 transition hover:border-cyan-200/45 hover:text-white"
                    onClick={() => sendMessage(prompt)}
                    disabled={isLoading}
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <div ref={threadRef} className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-slate-950/45 p-2.5">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[88%] rounded-xl border px-3 py-2 ${
                        message.role === 'user'
                          ? 'border-emerald-200/30 bg-gradient-to-r from-emerald-400/25 to-cyan-300/25 text-emerald-50'
                          : message.phase === 'error'
                            ? 'border-rose-300/35 bg-rose-500/10 text-rose-100'
                            : 'border-cyan-100/25 bg-slate-900/65 text-slate-100'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.text}</p>
                      <time className="mt-1 block text-[10px] text-slate-400">{formatTime(message.timestamp)}</time>
                    </div>
                  </div>
                ))}

                {typingText ? (
                  <div className="flex justify-start">
                    <div className="max-w-[88%] rounded-xl border border-cyan-100/25 bg-slate-900/65 px-3 py-2 text-slate-100">
                      <p className="text-sm">
                        {typingText}
                        <span className="ml-1 animate-pulse">_</span>
                      </p>
                      <time className="mt-1 block text-[10px] text-slate-400">{formatTime(Date.now())}</time>
                    </div>
                  </div>
                ) : null}
              </div>

              {error ? (
                <p className="rounded-lg border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                  {error}
                </p>
              ) : null}

              <form className="flex gap-2" onSubmit={handleSubmit}>
                <input
                  type="text"
                  className="sb-input h-10"
                  placeholder="Type: status, last tx, encryption info"
                  value={inputValue}
                  onChange={(event) => {
                    setInputValue(event.target.value);
                    markInteraction();
                  }}
                  disabled={isLoading}
                />
                <button type="submit" className="sb-button-primary h-10 min-w-20 px-3" disabled={isLoading || !inputValue.trim()}>
                  {isLoading ? '...' : 'Send'}
                </button>
              </form>

              <div className="max-h-24 space-y-1 overflow-y-auto rounded-lg border border-white/10 bg-black/20 p-2">
                {latestLogs.map((log) => (
                  <p key={`${log.timestamp}-${log.message}`} className="grid grid-cols-[70px_1fr] gap-2 text-[11px] text-slate-300">
                    <span className="font-mono text-slate-500">{formatTime(log.timestamp)}</span>
                    <span>{log.message}</span>
                  </p>
                ))}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </aside>
  );
}
