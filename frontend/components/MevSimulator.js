import { motion } from 'framer-motion';

export default function MevSimulator() {
  return (
    <section className="sb-card">
      <p className="sb-eyebrow">MEV Battle Visualizer</p>
      <h3 className="sb-heading-lg mt-2 text-2xl md:text-3xl">Red Glitch Attack vs Green Privacy Shield</h3>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="relative min-h-[250px] overflow-hidden rounded-2xl border border-rose-300/40 bg-gradient-to-br from-rose-950/40 to-slate-950/55 p-4">
          <p className="text-lg font-semibold text-rose-200">Public Mempool Exposure</p>
          <p className="mt-1 text-sm text-rose-100/75">Visible order detected by predatory searcher bots</p>

          <motion.div
            className="absolute left-[-25%] top-12 h-4 w-[42%] rounded bg-gradient-to-r from-transparent via-rose-400 to-transparent"
            animate={{ x: ['-20%', '130%'], opacity: [0, 0.9, 0] }}
            transition={{ duration: 1.15, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute left-[-22%] top-20 h-3 w-[38%] rounded bg-gradient-to-r from-transparent via-rose-300 to-transparent"
            animate={{ x: ['-10%', '130%'], opacity: [0, 0.7, 0] }}
            transition={{ duration: 1.25, repeat: Infinity, ease: 'linear', delay: 0.45 }}
          />

          <div className="relative mt-5 min-h-[130px] overflow-hidden rounded-xl border border-rose-300/35 bg-rose-950/35 p-3">
            <motion.div
              className="absolute left-2 top-4 h-2.5 w-11 rounded-full bg-gradient-to-r from-rose-400 to-rose-500"
              animate={{ x: [0, 80, 160, 220], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
            />
            <motion.div
              className="absolute left-2 top-11 h-2.5 w-11 rounded-full bg-gradient-to-r from-rose-400 to-rose-500"
              animate={{ x: [0, 80, 160, 220], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut', delay: 0.3 }}
            />
            <p className="absolute bottom-3 left-3 text-sm font-semibold text-rose-200">Bot front-run executed</p>
          </div>
        </div>

        <div className="relative min-h-[250px] overflow-hidden rounded-2xl border border-emerald-300/40 bg-gradient-to-br from-emerald-950/35 to-slate-950/55 p-4">
          <p className="text-lg font-semibold text-emerald-100">Encrypted ShadowBook Flow</p>
          <p className="mt-1 text-sm text-emerald-100/75">Ciphertext enters chain before bots can infer intent</p>

          <div className="relative mt-5 min-h-[130px] overflow-hidden rounded-xl border border-emerald-300/35 bg-emerald-950/30 p-3">
            <motion.div
              className="absolute left-2 top-6 h-2.5 w-11 rounded-full bg-gradient-to-r from-rose-400 to-rose-300"
              animate={{ x: [0, 70, 130, 130], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
            />
            <motion.div
              className="absolute right-3 top-3 rounded-lg border border-emerald-300/65 bg-emerald-300/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100"
              animate={{
                boxShadow: [
                  '0 0 14px rgba(72,255,165,0.35)',
                  '0 0 26px rgba(72,255,165,0.85)',
                  '0 0 14px rgba(72,255,165,0.35)',
                ],
              }}
              transition={{ duration: 1.35, repeat: Infinity }}
            >
              Shield Barrier
            </motion.div>
            <p className="absolute bottom-3 left-3 text-sm font-semibold text-emerald-100">Attack attempt failed</p>
          </div>
        </div>
      </div>
    </section>
  );
}
