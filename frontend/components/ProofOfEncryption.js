import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function scrambleHex(value) {
  if (!value) return '0x••••••••••••••••';
  const chars = 'ABCDEF0123456789';
  return value
    .split('')
    .map((ch, idx) => {
      if (idx < 6 || idx > value.length - 7 || ch === 'x') return ch;
      return chars[(idx * 5) % chars.length];
    })
    .join('');
}

export default function ProofOfEncryption({ flowState }) {
  const [step, setStep] = useState(0);

  const plaintextLine = flowState?.plaintext
    ? `plaintext: ${flowState.plaintext.orderType} ${flowState.plaintext.amount} @ ${flowState.plaintext.price}`
    : 'plaintext: pending input';
  const encryptedLine = flowState?.encrypted
    ? `encrypted: ${scrambleHex(flowState.encrypted.priceCtHash)}`
    : 'encrypted: awaiting cofhe payload';
  const hashLine = flowState?.matched?.txHash
    ? `hash-proof: ${flowState.matched.txHash}`
    : 'hash-proof: awaiting on-chain tx';

  const sequence = useMemo(
    () => [
      { label: 'PLAIN', text: plaintextLine },
      { label: 'ENCRYPT', text: encryptedLine },
      { label: 'HASH', text: hashLine },
    ],
    [encryptedLine, hashLine, plaintextLine]
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % sequence.length);
    }, 2200);
    return () => clearInterval(timer);
  }, [sequence.length]);

  return (
    <section className="glass card proof-cinematic-card">
      <p className="eyebrow">Proof of Encryption</p>
      <h3>Plaintext {'->'} Encrypted {'->'} On-Chain Hash</h3>

      <div className="terminal-proof">
        <div className="terminal-head">
          <span className="dot red" />
          <span className="dot yellow" />
          <span className="dot green" />
          <span className="terminal-title">shadowbook-proof-terminal</span>
        </div>

        <div className="terminal-body">
          <p className="terminal-line">
            <span>$</span> encrypt --before-mempool
          </p>
          <AnimatePresence mode="wait">
            <motion.p
              key={sequence[step].label}
              className="terminal-line active"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
            >
              <span>{sequence[step].label}:</span> {sequence[step].text}
              <span className="cursor">_</span>
            </motion.p>
          </AnimatePresence>
          <p className="terminal-line hash">
            <span>on-chain:</span> {hashLine}
          </p>
        </div>
      </div>

      <div className="proof-badges-row">
        <span className="proof-label">Encrypted before mempool</span>
        <span className="proof-label">Verifiable on-chain</span>
      </div>
    </section>
  );
}
