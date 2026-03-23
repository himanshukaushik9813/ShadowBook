import { motion } from 'framer-motion';

export default function MevSimulator() {
  return (
    <section className="glass card mev-cinematic-card">
      <p className="eyebrow">MEV Battle Visualizer</p>
      <h3>Red Glitch Attack vs Green Privacy Shield</h3>

      <div className="mev-cinematic-grid">
        <div className="attack-cinema-pane red">
          <p className="pane-title">Public Mempool Exposure</p>
          <p className="muted small">Visible order detected by predatory searcher bots</p>

          <motion.div
            className="glitch-band"
            animate={{ x: ['-20%', '130%'], opacity: [0, 0.9, 0] }}
            transition={{ duration: 1.15, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="glitch-band alt"
            animate={{ x: ['-10%', '130%'], opacity: [0, 0.75, 0] }}
            transition={{ duration: 1.25, repeat: Infinity, ease: 'linear', delay: 0.45 }}
          />

          <div className="attack-lane">
            <motion.div
              className="attack-beam"
              animate={{ x: [0, 80, 160, 220], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
            />
            <motion.div
              className="attack-beam second"
              animate={{ x: [0, 80, 160, 220], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut', delay: 0.3 }}
            />
            <p className="attack-status">Bot front-run executed</p>
          </div>
        </div>

        <div className="attack-cinema-pane green">
          <p className="pane-title">Encrypted ShadowBook Flow</p>
          <p className="muted small">Ciphertext enters chain before bots can infer intent</p>

          <div className="shield-lane">
            <motion.div
              className="attack-beam fail"
              animate={{ x: [0, 70, 130, 130], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
            />
            <motion.div
              className="shield-wall-cinematic"
              animate={{ boxShadow: ['0 0 14px rgba(72,255,165,0.35)', '0 0 26px rgba(72,255,165,0.85)', '0 0 14px rgba(72,255,165,0.35)'] }}
              transition={{ duration: 1.35, repeat: Infinity }}
            >
              Shield Barrier
            </motion.div>
            <p className="attack-status safe">Attack distortion blocked</p>
          </div>
        </div>
      </div>
    </section>
  );
}
