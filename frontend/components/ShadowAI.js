import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';

import { chatApi } from '../lib/ghostfiApi';

const PRODUCT_PROMPTS = [
  'Check my credit score',
  'Am I eligible for a loan?',
  'Generate proof',
];

const COMMAND_PROMPTS = ['status', 'last tx', 'encryption info'];

function formatTime(ts) {
  try {
    return new Date(ts).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch (_error) {
    return '--:--';
  }
}

function createMessage(role, text) {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
    role,
    text,
    timestamp: Date.now(),
  };
}

function getShortHash(hash) {
  if (!hash) return '--';
  const text = String(hash);
  if (text.length <= 16) return text;
  return `${text.slice(0, 10)}...${text.slice(-6)}`;
}

function getStageSummary(flowState) {
  const stages = flowState?.pipeline?.stages || {};
  const pairs = ['plaintext', 'encrypted', 'matched', 'decrypted'].map((stageKey) => {
    const value = stages[stageKey]?.state || 'idle';
    return `${stageKey}:${value}`;
  });
  return pairs.join(' | ');
}

function resolveCommand(input, flowState, actionText) {
  const normalized = String(input || '').trim().toLowerCase();
  if (!normalized) return null;

  if (normalized === 'status' || normalized === '/status') {
    const currentStage = flowState?.pipeline?.currentStage || 'idle';
    const txStatus = flowState?.tx?.status || 'idle';
    const txHash = flowState?.tx?.hash ? getShortHash(flowState.tx.hash) : 'none';
    const pipelineMessage = flowState?.pipeline?.statusMessage || actionText || 'Awaiting input.';
    return `System status: stage=${currentStage}, tx=${txStatus}, lastTx=${txHash}. ${pipelineMessage}`;
  }

  if (normalized === 'last tx' || normalized === '/lasttx' || normalized === 'last transaction') {
    const hash = flowState?.tx?.hash;
    if (!hash) return 'No transaction observed yet. Submit an encrypted order to start tracking.';
    const explorer = flowState?.tx?.explorerUrl || 'Explorer URL unavailable for current chain.';
    return `Last transaction: ${hash}. Explorer: ${explorer}`;
  }

  if (
    normalized === 'encryption info' ||
    normalized === '/encryption' ||
    normalized === 'cipher info'
  ) {
    const encrypted = flowState?.encrypted;
    if (!encrypted) {
      return 'No ciphertext available yet. Place an order first to inspect encryption artifacts.';
    }

    return `Encryption info: priceCt=${getShortHash(encrypted.priceCtHash)}, amountCt=${getShortHash(
      encrypted.amountCtHash
    )}, zone=${encrypted.securityZone}, utype=${encrypted.utype}. Stages => ${getStageSummary(flowState)}`;
  }

  if (normalized === 'help' || normalized === '/help') {
    return 'Command mode: try "status", "last tx", or "encryption info".';
  }

  return null;
}

export default function ShadowAI({ actionText, logs, institutionMode, flowState }) {
  const { address } = useAccount();
  const userId = address || 'anonymous';

  const [expanded, setExpanded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [typingText, setTypingText] = useState('');
  const [lastInteractionAt, setLastInteractionAt] = useState(0);
  const [messages, setMessages] = useState(() => [
    createMessage(
      'bot',
      'Shadow AI online. Type "status", "last tx", or "encryption info" for live system telemetry.'
    ),
  ]);

  const threadRef = useRef(null);
  const latestLogs = useMemo(() => logs.slice(0, 8), [logs]);
  const latestPhase = latestLogs[0]?.phase || 'info';

  function markInteraction() {
    setLastInteractionAt(Date.now());
  }

  useEffect(() => {
    if (!threadRef.current) return;
    threadRef.current.scrollTo({
      top: threadRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, typingText, latestLogs]);

  useEffect(() => {
    if (!expanded || isLoading) return undefined;
    const timeout = setTimeout(() => {
      setExpanded(false);
    }, 6500);
    return () => clearTimeout(timeout);
  }, [expanded, isLoading, lastInteractionAt]);

  async function typeReply(fullText) {
    const target = String(fullText || '');
    let index = 0;
    setTypingText('');

    while (index < target.length) {
      index += 1;
      setTypingText(target.slice(0, index));
      await new Promise((resolve) => setTimeout(resolve, 12));
    }
  }

  async function sendChat(prompt) {
    const content = String(prompt || '').trim();
    if (!content || isLoading) return;

    markInteraction();
    setError('');
    setInputValue('');
    setMessages((previous) => [...previous, createMessage('user', content)]);
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
      setMessages((previous) => [...previous, createMessage('bot', replyText)]);
      setTypingText('');
    } catch (chatError) {
      setTypingText('');
      setError(chatError.message || 'Unable to fetch chatbot response.');
      setMessages((previous) => [
        ...previous,
        createMessage('bot', 'Secure channel unavailable. Please retry in a few seconds.'),
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendChat(inputValue);
  }

  function togglePanel() {
    setExpanded((previous) => !previous);
    markInteraction();
  }

  function renderPromptButtons(items, className) {
    return items.map((prompt) => (
      <button
        key={prompt}
        type="button"
        className={className}
        onClick={() => sendChat(prompt)}
        disabled={isLoading}
      >
        {prompt}
      </button>
    ));
  }

  return (
    <aside className={`shadow-orb-shell phase-${latestPhase}`}>
      <motion.div
        className={`shadow-orb-hud chat-panel ${expanded ? 'open' : ''}`}
        initial={false}
        animate={{
          opacity: expanded ? 1 : 0,
          x: expanded ? 0 : 16,
          y: expanded ? 0 : 8,
          scale: expanded ? 1 : 0.95,
          pointerEvents: expanded ? 'auto' : 'none',
        }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
        onMouseMove={markInteraction}
        onClick={markInteraction}
      >
        <div className="chat-head-row">
          <div>
            <p className="eyebrow">Shadow AI Console</p>
            <p className="hud-phase">Live private execution telemetry</p>
          </div>
          {institutionMode ? <span className="institution-badge floating">Institution Grade Privacy</span> : null}
        </div>

        <p className="hud-action">{actionText}</p>

        <div className="quick-prompts command">
          {renderPromptButtons(COMMAND_PROMPTS, 'quick-prompt-btn command')}
        </div>

        <div className="quick-prompts">
          {renderPromptButtons(PRODUCT_PROMPTS, 'quick-prompt-btn')}
        </div>

        <div className="chat-thread" ref={threadRef}>
          {messages.map((message) => (
            <div key={message.id} className={`chat-bubble-row ${message.role === 'user' ? 'user' : 'bot'}`}>
              <div className={`chat-bubble ${message.role === 'user' ? 'user' : 'bot'}`}>
                <p>{message.text}</p>
                <time>{formatTime(message.timestamp)}</time>
              </div>
            </div>
          ))}

          {typingText ? (
            <div className="chat-bubble-row bot">
              <div className="chat-bubble bot typing">
                <p>{typingText}<span className="cursor">_</span></p>
                <time>{formatTime(Date.now())}</time>
              </div>
            </div>
          ) : null}
        </div>

        {error ? <p className="chat-error">{error}</p> : null}

        <form className="chat-input-row" onSubmit={handleSubmit}>
          <input
            type="text"
            value={inputValue}
            onChange={(event) => {
              setInputValue(event.target.value);
              markInteraction();
            }}
            disabled={isLoading}
            placeholder="Try: status, last tx, encryption info"
          />
          <button type="submit" className="btn secondary" disabled={isLoading || !inputValue.trim()}>
            {isLoading ? 'Thinking...' : 'Send'}
          </button>
        </form>

        <div className="chat-log-strip">
          {latestLogs.map((log) => (
            <p key={`${log.timestamp}-${log.message}`} className={`hud-log ${log.phase || 'info'}`}>
              <span>{formatTime(log.timestamp)}</span>
              <span>{log.message}</span>
            </p>
          ))}
        </div>
      </motion.div>

      <button
        type="button"
        className="shadow-orb"
        onClick={togglePanel}
        aria-label={expanded ? 'Close Shadow AI console' : 'Open Shadow AI console'}
      >
        <motion.span
          className="orb-ring"
          animate={{ scale: [1, 1.42], opacity: [0.7, 0] }}
          transition={{ duration: 1.9, repeat: Infinity, ease: 'easeOut' }}
        />
        <motion.span
          className="orb-core"
          animate={{
            boxShadow: [
              '0 0 18px rgba(61, 255, 175, 0.38)',
              '0 0 34px rgba(61, 255, 175, 0.85)',
              '0 0 18px rgba(61, 255, 175, 0.38)',
            ],
          }}
          transition={{ duration: 1.4, repeat: Infinity }}
        />
      </button>
    </aside>
  );
}
