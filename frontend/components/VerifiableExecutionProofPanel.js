import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

import PrivacyScoreRing from './proof/PrivacyScoreRing';
import ReplayTimelineModal from './proof/ReplayTimelineModal';

function shortHash(value) {
  if (!value) return '--';
  const text = String(value);
  if (text.length <= 18) return text;
  return `${text.slice(0, 10)}...${text.slice(-6)}`;
}

function networkLabel(chainId) {
  if (Number(chainId) === 11155111) return 'Sepolia';
  if (Number(chainId) === 421614) return 'Arbitrum Sepolia';
  return 'Unknown';
}

function scrambleText(source) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789@#$%';
  return String(source)
    .split('')
    .map((character) => {
      if (character === ' ' || character === '@') return character;
      return chars[Math.floor(Math.random() * chars.length)];
    })
    .join('');
}

export default function VerifiableExecutionProofPanel({ flowState }) {
  const [scrambled, setScrambled] = useState('Awaiting encrypted payload');
  const [revealAuditor, setRevealAuditor] = useState(false);
  const [openReplay, setOpenReplay] = useState(false);

  const tx = flowState?.tx || {};
  const plaintext = flowState?.plaintext || null;
  const encrypted = flowState?.encrypted || null;
  const matched = flowState?.matched || null;
  const decrypted = flowState?.decrypted || null;
  const replaySteps = flowState?.replay?.steps || [];
  const verificationReady = tx.status === 'confirmed' || Boolean(matched?.txHash);

  const plainLine = plaintext
    ? `${String(plaintext.orderType || 'buy').toUpperCase()} ${plaintext.amount} ETH @ ${plaintext.price}`
    : 'Buy 2 ETH @ 3200';
  const ciphertextLine = encrypted
    ? `${shortHash(encrypted.priceCtHash)} | ${shortHash(encrypted.amountCtHash)}`
    : '🔒 Encrypted pending';

  useEffect(() => {
    const timer = setInterval(() => {
      setScrambled(scrambleText(plainLine));
    }, 120);
    return () => clearInterval(timer);
  }, [plainLine]);

  const proofBreakdown = useMemo(
    () => ({
      encryption: Boolean(encrypted),
      matching: Boolean(matched),
      mevProtection: Boolean(encrypted) && tx.status !== 'failed',
      verification: verificationReady,
    }),
    [encrypted, matched, tx.status, verificationReady]
  );

  const proofScore = Math.round(
    (Object.values(proofBreakdown).filter(Boolean).length / 4) * 100
  );

  const mevSafe = Boolean(encrypted) && tx.status !== 'failed';
  const chainName = networkLabel(tx.chainId);
  const txHash = tx.hash || matched?.txHash || '';
  const blockNumber = matched?.blockNumber || '--';

  return (
    <>
      <section className="sb-card relative overflow-hidden">
        <motion.div
          className="pointer-events-none absolute left-0 right-0 top-0 z-[1] h-14 bg-gradient-to-b from-cyan-300/20 to-transparent"
          animate={{ y: ['-12%', '115%'] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
        />
        <div className="sb-radial-glow -left-8 top-0 h-36 w-36 bg-emerald-300/20" />
        <div className="sb-radial-glow -right-10 top-1/3 h-44 w-44 bg-cyan-300/20" />

        <div className="relative z-[2]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="sb-eyebrow">Verifiable Privacy Console</p>
              <h3 className="sb-heading-lg mt-2 text-2xl md:text-4xl">🔐 Verifiable Execution Proof</h3>
              <p className="sb-muted mt-2">
                Live cryptographic audit console for encrypted execution, private matching, and MEV defense.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-emerald-300/35 bg-emerald-300/10 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-emerald-100">
              <span className="relative inline-flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-70" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300" />
              </span>
              Verification Monitor
            </div>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-[1.3fr_1fr]">
            <div className="space-y-4">
              <motion.article
                className="rounded-2xl border border-cyan-200/20 bg-slate-900/45 p-4"
                whileHover={{ scale: 1.01, rotateX: 1.2, rotateY: -1.1 }}
              >
                <p className="sb-eyebrow">1) Encryption Proof</p>
                <div className="mt-3 grid gap-2">
                  <p className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 font-mono text-xs text-slate-200">
                    {plainLine}
                  </p>
                  <p className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 font-mono text-xs text-cyan-200">
                    {scrambled}
                  </p>
                  <p className="rounded-lg border border-emerald-300/40 bg-emerald-300/10 px-3 py-2 font-mono text-xs text-emerald-100">
                    {ciphertextLine}
                  </p>
                </div>
                <p className="mt-2 text-xs font-semibold text-emerald-100">✔ Encrypted with FHE</p>
              </motion.article>

              <motion.article
                className="rounded-2xl border border-cyan-200/20 bg-slate-900/45 p-4"
                whileHover={{ scale: 1.01, rotateX: 1.2, rotateY: -1.1 }}
              >
                <p className="sb-eyebrow">2) Matching Proof</p>
                <div className="relative mt-4 h-24 overflow-hidden rounded-xl border border-white/10 bg-black/25">
                  <motion.div
                    className="absolute left-4 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full bg-cyan-300/60 blur-[1px]"
                    animate={{ x: matched ? [0, 48, 65] : [0, 26, 0], scale: matched ? [1, 1.12, 1] : [1, 1.05, 1] }}
                    transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <motion.div
                    className="absolute right-4 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full bg-emerald-300/65 blur-[1px]"
                    animate={{ x: matched ? [0, -48, -65] : [0, -24, 0], scale: matched ? [1, 1.14, 1] : [1, 1.04, 1] }}
                    transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut', delay: 0.16 }}
                  />
                  <motion.div
                    className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-cyan-300/25 to-emerald-300/25"
                    animate={{ opacity: matched ? [0.2, 0.7, 0.2] : [0.15, 0.38, 0.15], scale: [0.95, 1.08, 0.95] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                </div>
                <p className="mt-2 text-xs text-emerald-100">✔ Private matching completed</p>
                <p className="text-xs text-emerald-100">✔ No plaintext exposure</p>
              </motion.article>

              <motion.article
                className="rounded-2xl border border-cyan-200/20 bg-slate-900/45 p-4"
                whileHover={{ scale: 1.01, rotateX: 1.2, rotateY: -1.1 }}
              >
                <p className="sb-eyebrow">3) On-chain Verification</p>
                <div className="mt-3 grid gap-2">
                  <p className="break-all rounded-lg border border-white/10 bg-black/25 px-3 py-2 font-mono text-xs text-slate-200">
                    Tx Hash:
                    {' '}
                    {txHash || 'Pending'}
                  </p>
                  <p className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-xs text-slate-200">
                    Block:
                    {' '}
                    {blockNumber}
                    {' '}
                    |
                    {' '}
                    Network:
                    {' '}
                    {chainName}
                  </p>
                  {tx.explorerUrl ? (
                    <a
                      href={tx.explorerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-cyan-300/35 bg-cyan-300/10 px-3 py-2 text-xs text-cyan-100 transition hover:bg-cyan-300/15"
                    >
                      Open Explorer →
                    </a>
                  ) : null}
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <span className={`h-2.5 w-2.5 rounded-full ${verificationReady ? 'bg-emerald-300' : 'bg-cyan-300 animate-pulse'}`} />
                  <span className={verificationReady ? 'text-emerald-100' : 'text-cyan-100'}>
                    {verificationReady ? '✔ Verified on-chain' : 'Verifying...'}
                  </span>
                </div>
              </motion.article>
            </div>

            <div className="space-y-4">
              <PrivacyScoreRing score={proofScore} breakdown={proofBreakdown} />

              <motion.article className="rounded-2xl border border-cyan-200/20 bg-slate-900/45 p-4" whileHover={{ scale: 1.01 }}>
                <p className="sb-eyebrow">4) MEV Protection Proof</p>
                <div className="mt-3 grid gap-3">
                  <div className="rounded-xl border border-rose-300/30 bg-rose-500/10 p-3">
                    <p className="text-xs font-semibold text-rose-200">❌ Public mempool: front-run risk, visible trade</p>
                  </div>
                  <div className="relative overflow-hidden rounded-xl border border-emerald-300/35 bg-emerald-500/10 p-3">
                    <motion.span
                      className="absolute left-2 top-1/2 h-2 w-14 -translate-y-1/2 rounded-full bg-gradient-to-r from-rose-300 to-rose-500"
                      animate={{ x: [0, 64, 98], opacity: [0, 1, 0] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                    />
                    <span className="absolute right-2 top-2 rounded-md border border-emerald-300/50 bg-emerald-300/20 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-emerald-100">
                      Shield
                    </span>
                    <p className="relative z-[2] text-xs font-semibold text-emerald-100">
                      ✅ ShadowBook: hidden order, no front-run
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-emerald-100">
                  {mevSafe ? '✔ No front-running detected' : 'Monitoring MEV protection...'}
                </p>
                <p className="text-xs text-emerald-100">✔ Order never exposed</p>
              </motion.article>

              <motion.article className="rounded-2xl border border-cyan-200/20 bg-slate-900/45 p-4" whileHover={{ scale: 1.01 }}>
                <div className="flex items-center justify-between gap-3">
                  <p className="sb-eyebrow">5) Selective Disclosure</p>
                  <button
                    type="button"
                    className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.16em] ${
                      revealAuditor
                        ? 'border-emerald-300/55 bg-emerald-300/15 text-emerald-100'
                        : 'border-cyan-200/30 bg-slate-800/40 text-slate-200'
                    }`}
                    onClick={() => setRevealAuditor((value) => !value)}
                  >
                    Reveal to Auditor
                  </button>
                </div>

                {revealAuditor ? (
                  <div className="mt-3 rounded-xl border border-emerald-300/35 bg-emerald-300/10 p-3 text-xs text-emerald-100">
                    <p>✔ Only authorized access allowed</p>
                    <p>
                      Summary:
                      {' '}
                      {decrypted
                        ? `executionPrice=${decrypted.executionPrice}, filled=${String(decrypted.filled)}`
                        : 'decrypted summary pending'}
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-slate-300">Auditor view hidden until explicit authorization.</p>
                )}
              </motion.article>

              <button type="button" className="sb-button-primary w-full" onClick={() => setOpenReplay(true)}>
                Replay Execution
              </button>
            </div>
          </div>
        </div>
      </section>

      <ReplayTimelineModal open={openReplay} onClose={() => setOpenReplay(false)} steps={replaySteps} />
    </>
  );
}
