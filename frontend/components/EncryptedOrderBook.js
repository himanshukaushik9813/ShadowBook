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
    <section className="glass card orderbook-card">
      <div className="orderbook-head">
        <div>
          <p className="eyebrow">Visibility Shield</p>
          <h3>Encrypted Order Book</h3>
        </div>
      </div>

      <span className="orderbook-badge">Hidden from public mempool</span>

      <div className="orderbook-table-head">
        <span>Price</span>
        <span>Size</span>
        <span>Total</span>
      </div>

      <div className="orderbook-rows">
        {rows.map((row, index) => (
          <motion.div
            key={`${row.price}-${index}`}
            className="orderbook-row"
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

      <div className="orderbook-footer">
        <p className="small muted">
          Spread: <span className="mono">{priceSeed ? 'Encrypted' : 'Awaiting input'}</span>
        </p>
        <p className={`small mono orderbook-status ${txStatus}`}>tx: {txStatus}</p>
      </div>
    </section>
  );
}
