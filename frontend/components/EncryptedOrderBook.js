import { motion } from 'framer-motion';

function maskCiphertext(value, index) {
  if (!value) {
    const variants = ['xxxxxx', 'xxxxxxx', 'xxxxx', 'xxxxxxxx'];
    return variants[index % variants.length];
  }

  const text = String(value);
  if (text.length < 12) return text;
  return `${text.slice(0, 4)}xxxx${text.slice(-4)}`;
}

export default function EncryptedOrderBook({ flowState }) {
  const encrypted = flowState?.encrypted;
  const matched = flowState?.matched;
  const txStatus = flowState?.tx?.status || 'idle';

  const priceSeed = encrypted?.priceCtHash || matched?.encryptedExecutionPrice;
  const amountSeed = encrypted?.amountCtHash || matched?.encryptedFillStatus;

  const rows = Array.from({ length: 6 }, (_, idx) => ({
    price: maskCiphertext(priceSeed, idx),
    size: maskCiphertext(amountSeed, idx + 1),
    total: maskCiphertext(priceSeed || amountSeed, idx + 2),
  }));

  return (
    <section className="sb-card h-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="sb-eyebrow">Visibility Shield</p>
          <h3 className="sb-heading-lg mt-2 text-2xl">Encrypted Order Book</h3>
        </div>
      </div>

      <span className="mt-3 inline-flex rounded-full border border-cyan-300/35 bg-cyan-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-100">
        Hidden from public mempool
      </span>

      <div className="mt-4 grid grid-cols-[1fr_0.8fr_0.95fr] gap-2 text-xs uppercase tracking-[0.14em] text-slate-400">
        <span>Price</span>
        <span>Size</span>
        <span>Total</span>
      </div>

      <div className="mt-2 space-y-2 rounded-2xl border border-cyan-200/15 bg-slate-950/45 p-3">
        {rows.map((row, index) => (
          <motion.div
            key={`${row.price}-${index}`}
            className="grid grid-cols-[1fr_0.8fr_0.95fr] gap-2 rounded-xl border border-cyan-100/10 bg-slate-900/45 px-2 py-2 text-xs text-slate-200"
            initial={{ opacity: 0.65 }}
            animate={{ opacity: [0.65, 1, 0.65] }}
            transition={{ duration: 2.6, repeat: Infinity, delay: index * 0.12 }}
          >
            <span>{row.price}</span>
            <span>{row.size}</span>
            <span>{row.total}</span>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-xs">
        <p className="text-slate-300">
          Spread:
          {' '}
          <span className="font-mono text-cyan-100">{priceSeed ? 'Encrypted' : 'Awaiting input'}</span>
        </p>
        <p
          className={`font-mono uppercase tracking-[0.15em] ${
            txStatus === 'confirmed'
              ? 'text-emerald-100'
              : txStatus === 'failed'
                ? 'text-rose-200'
                : 'text-cyan-100'
          }`}
        >
          tx: {txStatus}
        </p>
      </div>
    </section>
  );
}
