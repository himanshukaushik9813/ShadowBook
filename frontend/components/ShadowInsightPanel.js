import { motion } from 'framer-motion';

const ASSETS = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    price: '$68,420',
    change: '+5.42%',
    positive: true,
    points: [10, 12, 11, 13, 15, 14, 17],
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    price: '$3,245',
    change: '+3.18%',
    positive: true,
    points: [8, 9, 10, 9, 11, 12, 13],
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    price: '$164.82',
    change: '-1.07%',
    positive: false,
    points: [14, 15, 13, 12, 11, 12, 10],
  },
];

const CHAIN_USAGE = [
  { label: 'Ethereum', value: 76 },
  { label: 'Arbitrum', value: 58 },
  { label: 'Base', value: 41 },
];

const ALLOCATION = [
  { label: 'BTC', value: '46%', color: '#ff8a3c' },
  { label: 'ETH', value: '30%', color: '#f6b26b' },
  { label: 'Others', value: '24%', color: '#7f6a59' },
];

const PERFORMANCE_POINTS = [36, 42, 38, 48, 52, 50, 58, 64, 61, 68, 72, 76];
const CHART_WIDTH = 640;
const CHART_HEIGHT = 260;
const CHART_PADDING = 18;

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
      <circle cx="9" cy="9" r="5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12.5 12.5L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PulseIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
      <path
        d="M3 10h3l1.5-3 3 6 1.5-3H17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
      <path
        d="M10 4.5a3 3 0 00-3 3V9c0 .9-.3 1.8-.9 2.5L5 12.7h10l-1.1-1.2A3.8 3.8 0 0113 9V7.5a3 3 0 00-3-3z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8.5 14.5a1.6 1.6 0 003 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function AdjustIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
      <path d="M4 6h12M6 10h8M8 14h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function buildLinePath(points, width, height, padding) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const xStep = (width - padding * 2) / (points.length - 1 || 1);

  return points
    .map((point, index) => {
      const x = padding + xStep * index;
      const normalized = max === min ? 0.5 : (point - min) / (max - min);
      const y = height - padding - normalized * (height - padding * 2);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
}

function buildAreaPath(points, width, height, padding) {
  const line = buildLinePath(points, width, height, padding);
  const xStep = (width - padding * 2) / (points.length - 1 || 1);
  const lastX = padding + xStep * (points.length - 1);
  return `${line} L ${lastX} ${height - padding} L ${padding} ${height - padding} Z`;
}

function MiniSparkline({ points, positive }) {
  const line = buildLinePath(points, 120, 44, 4);

  return (
    <svg viewBox="0 0 120 44" className="h-11 w-full" fill="none" aria-hidden>
      <path
        d={line}
        stroke={positive ? '#ffb36b' : '#b89b86'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AssetCard({ asset, index }) {
  return (
    <motion.article
      className="relative overflow-hidden rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,14,11,0.9),rgba(12,10,9,0.86))] p-5 shadow-[0_18px_44px_rgba(0,0,0,0.22)]"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      whileHover={{
        y: -4,
        boxShadow: '0 22px 52px rgba(255,138,60,0.14)',
        borderColor: 'rgba(255,179,107,0.16)',
      }}
      transition={{ duration: 0.32, delay: index * 0.06 }}
    >
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#ffb36b]/25 to-transparent" />
      <div className="absolute right-4 top-4 h-16 w-16 rounded-full bg-[#ff8a3c]/[0.08] blur-3xl" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.08em] text-[#a99684]">{asset.symbol}</p>
          <h4 className="mt-2 text-lg font-semibold text-white">{asset.name}</h4>
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 text-xs ${
            asset.positive
              ? 'border-[#ffb36b]/18 bg-[#ff8a3c]/[0.08] text-[#ffe0c2]'
              : 'border-white/10 bg-white/[0.03] text-slate-300'
          }`}
        >
          {asset.change}
        </span>
      </div>

      <p className="relative mt-6 text-2xl font-semibold tracking-[-0.03em] text-white">{asset.price}</p>
      <div className="relative mt-4">
        <MiniSparkline points={asset.points} positive={asset.positive} />
      </div>
    </motion.article>
  );
}

function InsightTopBar() {
  return (
    <motion.div
      className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[rgba(20,16,14,0.68)] px-5 py-4 shadow-[0_18px_44px_rgba(0,0,0,0.24)] backdrop-blur-xl"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.35 }}
    >
      <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#ffb36b]/25 to-transparent" />
      <div className="absolute left-16 top-1/2 hidden h-12 w-24 -translate-y-1/2 rounded-full bg-[#ff8a3c]/[0.08] blur-3xl md:block" />

      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative block lg:w-[320px]">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            <SearchIcon />
          </span>
          <input
            type="text"
            className="sb-input h-11 pl-10"
            placeholder="Search assets, pairs, or routed flows"
            aria-label="Search insights"
          />
        </label>

        <div className="flex items-center gap-2">
          {[PulseIcon, BellIcon, AdjustIcon].map((Icon, index) => (
            <motion.button
              key={index}
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-slate-300 transition-colors hover:border-[#ffb36b]/16 hover:text-[#ffe0c2]"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon />
            </motion.button>
          ))}
        </div>

        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ffb36b]/18 bg-[#ff8a3c]/[0.08] text-sm font-semibold text-[#ffe0c2]">
            SB
          </div>
          <div>
            <p className="text-sm font-medium text-white">Shadow Ops</p>
            <p className="text-xs text-slate-500">Execution Desk</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PerformanceChartCard() {
  const line = buildLinePath(PERFORMANCE_POINTS, CHART_WIDTH, CHART_HEIGHT, CHART_PADDING);
  const area = buildAreaPath(PERFORMANCE_POINTS, CHART_WIDTH, CHART_HEIGHT, CHART_PADDING);

  return (
    <motion.article
      className="relative overflow-hidden rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,14,11,0.92),rgba(12,10,9,0.88))] p-6 shadow-[0_22px_52px_rgba(0,0,0,0.24)]"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.35 }}
    >
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#ffb36b]/25 to-transparent" />
      <div className="absolute left-[-20px] top-8 h-24 w-24 rounded-full bg-[#ff8a3c]/[0.08] blur-[72px]" />
      <div className="absolute bottom-0 right-10 h-24 w-32 rounded-full bg-[#f59e0b]/[0.06] blur-[80px]" />
      <motion.div
        className="pointer-events-none absolute inset-y-0 left-[-24%] w-[24%]"
        animate={{ x: ['0%', '480%'] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        style={{
          background:
            'linear-gradient(90deg, rgba(0,0,0,0), rgba(255,179,107,0.08), rgba(0,0,0,0))',
        }}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.08em] text-[#a99684]">Performance</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">Network performance</h3>
          <p className="mt-2 text-sm text-slate-400">Private execution throughput across the current cycle.</p>
        </div>
        <div className="rounded-full border border-[#ffb36b]/16 bg-[#ff8a3c]/[0.08] px-3 py-1.5 text-xs text-[#ffe0c2]">
          +12.8% this week
        </div>
      </div>

      <div className="relative mt-8 overflow-hidden rounded-[24px] border border-white/8 bg-[rgba(8,7,6,0.5)] p-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,138,60,0.16),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_36%)]" />
        <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="relative h-[260px] w-full" fill="none" aria-hidden>
          <defs>
            <linearGradient id="shadowbookChartArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,138,60,0.3)" />
              <stop offset="100%" stopColor="rgba(255,138,60,0)" />
            </linearGradient>
            <linearGradient id="shadowbookChartLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ffd9b3" />
              <stop offset="50%" stopColor="#ffb36b" />
              <stop offset="100%" stopColor="#ff8a3c" />
            </linearGradient>
          </defs>

          {[0, 1, 2, 3].map((row) => (
            <line
              key={row}
              x1={CHART_PADDING}
              x2={CHART_WIDTH - CHART_PADDING}
              y1={CHART_PADDING + row * 56}
              y2={CHART_PADDING + row * 56}
              stroke="rgba(255,255,255,0.06)"
              strokeDasharray="4 8"
            />
          ))}

          <motion.path
            d={area}
            fill="url(#shadowbookChartArea)"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.1 }}
          />
          <motion.path
            d={line}
            stroke="url(#shadowbookChartLine)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0.6 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
      </div>
    </motion.article>
  );
}

function TokenAllocationCard() {
  return (
    <motion.article
      className="relative overflow-hidden rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,14,11,0.9),rgba(12,10,9,0.86))] p-6 shadow-[0_20px_46px_rgba(0,0,0,0.22)]"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.35, delay: 0.04 }}
    >
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#ffb36b]/25 to-transparent" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.08em] text-[#a99684]">Allocation</p>
          <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-white">Token allocation</h3>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-400">
          24h view
        </span>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-[140px_1fr] md:items-center">
        <div className="relative mx-auto h-[140px] w-[140px]">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                'conic-gradient(#ff8a3c 0 46%, #f6b26b 46% 76%, #7f6a59 76% 100%)',
            }}
          />
          <div className="absolute inset-[18px] flex items-center justify-center rounded-full border border-white/8 bg-[#0f0d0c]">
            <div className="text-center">
              <p className="text-[11px] text-slate-500">Total</p>
              <p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-white">$96K</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {ALLOCATION.map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-2xl border border-white/8 bg-[rgba(8,7,6,0.42)] px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-slate-300">{item.label}</span>
              </div>
              <span className="text-sm font-medium text-white">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.article>
  );
}

function ChainUsageCard() {
  return (
    <motion.article
      className="relative overflow-hidden rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,14,11,0.9),rgba(12,10,9,0.86))] p-6 shadow-[0_20px_46px_rgba(0,0,0,0.22)]"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.35, delay: 0.08 }}
    >
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#ffb36b]/25 to-transparent" />
      <p className="text-xs font-medium tracking-[0.08em] text-[#a99684]">Routing</p>
      <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-white">Chain usage</h3>
      <p className="mt-2 text-sm text-slate-400">Private routing distribution by network.</p>

      <div className="mt-6 space-y-4">
        {CHAIN_USAGE.map((item) => (
          <div key={item.label}>
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-300">{item.label}</span>
              <span className="text-white">{item.value}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                whileInView={{ width: `${item.value}%` }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.7, delay: 0.12 }}
                style={{
                  background:
                    'linear-gradient(90deg, rgba(255,138,60,0.9), rgba(255,179,107,0.92), rgba(245,158,11,0.78))',
                  boxShadow: '0 0 18px rgba(255,138,60,0.16)',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.article>
  );
}

export default function ShadowInsightPanel() {
  return (
    <motion.section
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.4 }}
    >
      <div>
        <p className="sb-eyebrow">Insights</p>
        <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.03em] text-white">
          Market intelligence
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
          Selective context for execution decisions, designed as a premium analytics surface inside ShadowBook.
        </p>
      </div>

      <InsightTopBar />

      <div className="grid gap-4 md:grid-cols-3">
        {ASSETS.map((asset, index) => (
          <AssetCard key={asset.symbol} asset={asset} index={index} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
        <PerformanceChartCard />
        <div className="space-y-6">
          <TokenAllocationCard />
          <ChainUsageCard />
        </div>
      </div>
    </motion.section>
  );
}
