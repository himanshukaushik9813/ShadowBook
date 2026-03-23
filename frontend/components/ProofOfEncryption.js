import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

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
    : 'plaintext: awaiting input';
  const encryptedLine = flowState?.encrypted
    ? `encrypted: ${scrambleHex(flowState.encrypted.priceCtHash)}`
    : 'encrypted: processing...';
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
    <section className="sb-card">
      <p className="sb-eyebrow">Proof of Encryption</p>
      <h3 className="sb-heading-lg mt-2 text-2xl md:text-3xl">Plaintext → Encrypted → On-Chain Hash</h3>

      <div className="mt-5 overflow-hidden rounded-2xl border border-cyan-200/25 bg-slate-950/70">
        <div className="flex items-center gap-2 border-b border-white/10 bg-slate-900/80 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
          <span className="ml-2 text-xs tracking-[0.08em] text-slate-400">shadowbook-proof-terminal</span>
        </div>

        <div className="space-y-2 px-4 py-4 font-mono text-sm">
          <p className="text-slate-400">
            <span className="text-cyan-200">$</span>
            {' '}
            encrypt --before-mempool
          </p>
          <AnimatePresence mode="wait">
            <motion.p
              key={sequence[step].label}
              className="text-cyan-100"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
            >
              <span className="text-cyan-300">{sequence[step].label}:</span>
              {' '}
              {sequence[step].text}
              <span className="ml-1 animate-pulse">_</span>
            </motion.p>
          </AnimatePresence>
          <p className="break-all text-emerald-200">
            <span className="text-emerald-300">on-chain:</span>
            {' '}
            {hashLine}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full border border-emerald-300/40 bg-emerald-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-100">
          Encrypted before mempool
        </span>
        <span className="rounded-full border border-cyan-300/40 bg-cyan-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-100">
          Verifiable on-chain
        </span>
      </div>
    </section>
  );
}
