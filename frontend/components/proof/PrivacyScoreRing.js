import { motion } from 'framer-motion';

const RADIUS = 48;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function PrivacyScoreRing({ score, breakdown }) {
  const normalized = Math.max(0, Math.min(100, Number(score || 0)));
  const offset = CIRCUMFERENCE - (normalized / 100) * CIRCUMFERENCE;

  const items = [
    { key: 'encryption', label: 'Encryption' },
    { key: 'matching', label: 'Matching' },
    { key: 'mevProtection', label: 'MEV Protection' },
    { key: 'verification', label: 'Verification' },
  ];

  return (
    <div className="rounded-2xl border border-cyan-200/20 bg-slate-900/45 p-4">
      <p className="sb-eyebrow">Privacy Score</p>
      <div className="mt-3 flex items-center gap-4">
        <div className="relative h-28 w-28">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle cx="60" cy="60" r={RADIUS} stroke="rgba(148, 163, 184, 0.22)" strokeWidth="10" fill="none" />
            <motion.circle
              cx="60"
              cy="60"
              r={RADIUS}
              stroke="url(#sbRingGradient)"
              strokeWidth="10"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={CIRCUMFERENCE}
              initial={{ strokeDashoffset: CIRCUMFERENCE }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
            <defs>
              <linearGradient id="sbRingGradient" x1="0%" x2="100%" y1="0%" y2="0%">
                <stop offset="0%" stopColor="#3cffb6" />
                <stop offset="100%" stopColor="#4fd7ff" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="font-display text-2xl font-bold text-white">{normalized}</p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">/ 100</p>
          </div>
        </div>

        <div className="space-y-2">
          {items.map((item) => {
            const status = Boolean(breakdown?.[item.key]);
            return (
              <div key={item.key} className="flex items-center gap-2 text-sm">
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full border text-xs ${
                    status
                      ? 'border-emerald-300/50 bg-emerald-300/15 text-emerald-100'
                      : 'border-slate-500/40 bg-slate-700/30 text-slate-300'
                  }`}
                >
                  {status ? '✓' : '•'}
                </span>
                <span className={status ? 'text-emerald-100' : 'text-slate-300'}>{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
