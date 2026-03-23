import { motion } from 'framer-motion';

const STEPS = [
  {
    key: 'user',
    title: 'User',
    subtitle: 'Order intent',
    helper: 'Plaintext captured in client',
    icon: '👤',
  },
  {
    key: 'encrypt',
    title: 'Encrypt',
    subtitle: 'Client-side encryption',
    helper: 'Order values converted to ciphertext',
    icon: '🔐',
  },
  {
    key: 'match',
    title: 'Encrypted Matching',
    subtitle: 'Encrypted matching',
    helper: 'Price/size checks run on encrypted state',
    icon: '⚙️',
  },
  {
    key: 'onchain',
    title: 'On-chain',
    subtitle: 'Settlement on testnet',
    helper: 'Verified transaction receipt + event logs',
    icon: '⛓',
  },
  {
    key: 'decrypt',
    title: 'Decrypt',
    subtitle: 'Secure decryption',
    helper: 'Execution result revealed locally',
    icon: '🔓',
  },
];

export default function ArchitectureFlow() {
  return (
    <section className="sb-card relative overflow-hidden">
      <div className="sb-radial-glow left-1/4 top-0 h-48 w-48 -translate-y-1/3 bg-cyan-400/20" />
      <div className="sb-radial-glow right-1/4 top-1/2 h-56 w-56 -translate-y-1/2 bg-emerald-400/20" />

      <div className="relative">
        <p className="sb-eyebrow">Architecture Flow</p>
        <h3 className="sb-heading-lg mt-2 text-2xl md:text-3xl">Secure Execution Graph</h3>
        <p className="sb-muted mt-2">
          User → Encrypt (client) → Encrypted Matching → On-chain → Decrypt Result
        </p>
      </div>

      <div className="relative mt-8 overflow-x-auto pb-1">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-5 items-start gap-4">
            {STEPS.map((step, index) => (
              <div key={step.key} className="relative">
                <motion.div
                  className="group relative rounded-2xl border border-cyan-100/20 bg-slate-900/50 p-4 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-cyan-200/45 hover:shadow-sbBlueGlow"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-300/12 text-sm shadow-sbGlow">
                      {step.icon}
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Step {index + 1}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-100">{step.title}</p>
                  <p className="mt-1 text-xs text-cyan-200/85">{step.subtitle}</p>
                  <div className="mt-3 rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-[11px] text-slate-300 opacity-0 transition group-hover:opacity-100">
                    {step.helper}
                  </div>
                </motion.div>

                {index < STEPS.length - 1 ? (
                  <div className="absolute left-[calc(100%-4px)] top-1/2 hidden w-4 -translate-y-1/2 md:block">
                    <div className="sb-flow-line" />
                    <motion.span
                      className="absolute -top-[3px] h-2 w-2 rounded-full bg-emerald-300 shadow-sbGlow"
                      animate={{ x: [0, 44], opacity: [0, 1, 0] }}
                      transition={{ duration: 1.4, repeat: Infinity, delay: index * 0.12, ease: 'linear' }}
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-2 text-xs text-slate-300 md:grid-cols-3">
        <p className="rounded-xl border border-cyan-200/15 bg-slate-900/35 px-3 py-2">Client-side encryption</p>
        <p className="rounded-xl border border-cyan-200/15 bg-slate-900/35 px-3 py-2">On-chain encrypted matching</p>
        <p className="rounded-xl border border-cyan-200/15 bg-slate-900/35 px-3 py-2">Secure decryption + private result</p>
      </div>
    </section>
  );
}
