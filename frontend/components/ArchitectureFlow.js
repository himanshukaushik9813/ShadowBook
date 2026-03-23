import { motion } from 'framer-motion';

const steps = [
  'User',
  'Encrypt (client)',
  'Smart Contract',
  'Encrypted Matching',
  'Decrypt Result',
];

export default function ArchitectureFlow() {
  return (
    <section className="glass card architecture-card">
      <p className="eyebrow">Architecture</p>
      <h3>Private Execution Flow</h3>

      <div className="architecture-row">
        {steps.map((step, index) => (
          <div key={step} className="arch-item">
            <motion.div
              className="arch-node"
              animate={{
                boxShadow: [
                  '0 0 0 rgba(39, 213, 255, 0.0)',
                  '0 0 16px rgba(39, 213, 255, 0.38)',
                  '0 0 0 rgba(39, 213, 255, 0.0)',
                ],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                delay: index * 0.2,
              }}
            >
              {step}
            </motion.div>

            {index < steps.length - 1 ? (
              <div className="arch-link">
                <div className="arch-link-line" />
                <div
                  className="arch-link-dot"
                  style={{ animationDelay: `${index * 0.1}s` }}
                />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
