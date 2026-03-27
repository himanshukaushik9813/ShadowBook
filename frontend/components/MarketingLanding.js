import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';

import BrandSignature from './BrandSignature';

const LUXURY_EASE = [0.22, 1, 0.36, 1];

const TRUST_ITEMS = [
  {
    label: 'Encrypted Execution',
    detail: 'Orders are sealed in the browser before routing, so intent never appears in the open.',
  },
  {
    label: 'Zero MEV Exposure',
    detail: 'Price, size, and intent stay hidden while the order moves through private execution paths.',
  },
  {
    label: 'Verifiable Settlement',
    detail: 'Each completed order leaves behind a clean proof-backed verification record after settlement.',
  },
];

const TRUST_LABELS = [
  'Client-side encryption',
  'Hidden routing path',
  'No public mempool',
  'Proof-backed settlement',
];

const TIMELINE_STEPS = [
  {
    title: 'Encrypt',
    detail: 'Convert the order into encrypted payloads inside the browser.',
  },
  {
    title: 'Route Privately',
    detail: 'Send encrypted intent through a private execution path instead of a public mempool.',
  },
  {
    title: 'Verify Proof',
    detail: 'Confirm settlement with transaction hash, inclusion status, and proof details.',
  },
];

const HOW_IT_WORKS_VISUAL_STEPS = [
  {
    id: 'intent',
    label: 'Intent',
    detail: 'User input',
    x: 58,
    y: 208,
  },
  {
    id: 'encrypt',
    label: 'Encrypt',
    detail: 'Payload sealed',
    x: 168,
    y: 118,
  },
  {
    id: 'route',
    label: 'Route',
    detail: 'Hidden path',
    x: 252,
    y: 226,
    highlight: true,
  },
  {
    id: 'execute',
    label: 'Execute',
    detail: 'Execution core',
    x: 338,
    y: 170,
    core: true,
  },
  {
    id: 'settle',
    label: 'Settle',
    detail: 'Verified',
    x: 455,
    y: 122,
    final: true,
  },
];

const VALUE_ITEMS = [
  {
    title: 'Hidden Intent',
    detail: 'Order intent stays sealed during submission, routing, and matching.',
  },
  {
    title: 'Private Routing',
    detail: 'Execution moves through a private path instead of a public mempool surface.',
  },
  {
    title: 'Proof-Based Trust',
    detail: 'Settlement outcomes remain independently checkable after execution completes.',
  },
];

const PARTICLES = [
  { top: '12%', left: '8%', size: 6, delay: 0 },
  { top: '18%', left: '28%', size: 4, delay: 0.4 },
  { top: '24%', left: '72%', size: 5, delay: 1.2 },
  { top: '38%', left: '14%', size: 4, delay: 0.9 },
  { top: '44%', left: '56%', size: 6, delay: 1.8 },
  { top: '54%', left: '82%', size: 4, delay: 0.6 },
  { top: '66%', left: '20%', size: 5, delay: 1.5 },
  { top: '74%', left: '68%', size: 4, delay: 0.3 },
  { top: '84%', left: '38%', size: 5, delay: 1.1 },
];

function NavLink({ href, children }) {
  const external = href.startsWith('http');
  return (
    <motion.a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      className="rounded-full border border-transparent px-3 py-2 text-sm text-slate-400 transition hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
      whileHover={{ y: -1 }}
      transition={{ duration: 0.2, ease: LUXURY_EASE }}
    >
      {children}
    </motion.a>
  );
}

function MagneticLink({ href, className, children }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 220, damping: 18, mass: 0.5 });
  const springY = useSpring(y, { stiffness: 220, damping: 18, mass: 0.5 });

  function handleMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const offsetX = event.clientX - (rect.left + rect.width / 2);
    const offsetY = event.clientY - (rect.top + rect.height / 2);
    x.set(Math.max(-10, Math.min(10, offsetX * 0.12)));
    y.set(Math.max(-8, Math.min(8, offsetY * 0.12)));
  }

  function handleLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel={href.startsWith('http') ? 'noreferrer' : undefined}
      className={className}
      style={{ x: springX, y: springY }}
      whileHover={{ scale: 1.018, y: -1 }}
      whileTap={{ scale: 0.99 }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      {children}
    </motion.a>
  );
}

function LandingNavbar() {
  return (
    <header className="sticky top-0 z-[50] px-4 pt-4 md:px-6">
      <motion.div
        className="sb-container"
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: LUXURY_EASE }}
      >
        <div className="relative flex h-[72px] items-center justify-between overflow-hidden rounded-[24px] border border-white/10 bg-[rgba(20,20,20,0.6)] px-4 shadow-[0_20px_54px_rgba(0,0,0,0.32)] backdrop-blur-[12px] sm:px-5 md:px-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,179,107,0.08),rgba(255,255,255,0.01)_34%,transparent_64%)]" />
          <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#ffb36b]/35 to-transparent" />
          <div className="absolute left-8 top-1/2 hidden h-10 w-24 -translate-y-1/2 rounded-full bg-[#ff8a3c]/10 blur-2xl lg:block" />
          <div className="absolute right-12 top-1/2 hidden h-10 w-28 -translate-y-1/2 rounded-full bg-[#f59e0b]/10 blur-2xl lg:block" />

          <div className="relative flex items-center gap-4">
            <BrandSignature href="/" subtitle="Private execution" tone="warm" />
            <div className="hidden rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 lg:flex">
              <span className="text-[11px] font-medium tracking-[0.12em] text-slate-300">
                Encrypted orderflow
              </span>
            </div>
          </div>

          <nav className="relative hidden items-center gap-2 md:flex">
            <NavLink href="#top">Home</NavLink>
            <NavLink href="#features">Features</NavLink>
            <NavLink href="#how-it-works">How It Works</NavLink>
            <NavLink href="#security">Security</NavLink>
            <NavLink href="https://github.com/himanshukaushik9813/ShadowBook">Docs</NavLink>
            <NavLink href="https://github.com/himanshukaushik9813/ShadowBook">GitHub</NavLink>
          </nav>

          <div className="relative flex items-center gap-2">
            <Link
              href="/app"
              className="hidden min-w-[124px] items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-200 backdrop-blur-xl transition-colors duration-300 hover:border-[#ffb36b]/16 hover:bg-white/[0.05] sm:inline-flex"
            >
              Connect Wallet
            </Link>
            <Link
              href="/app"
              className="group relative inline-flex min-w-[132px] items-center justify-center overflow-hidden rounded-lg border border-[#ffb36b]/15 bg-[linear-gradient(180deg,rgba(255,154,84,0.94),rgba(226,117,46,0.94))] px-5 py-2.5 text-sm font-medium text-white shadow-[0_16px_40px_rgba(255,138,60,0.16)] transition-all duration-300 hover:shadow-[0_20px_48px_rgba(255,138,60,0.22)]"
            >
              <span className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#ffe0c2]/75 to-transparent opacity-75" />
              <span className="relative">Launch App</span>
            </Link>
          </div>
        </div>
      </motion.div>
    </header>
  );
}

function HeroBackdrop({ styleGrid, styleGlowA, styleGlowB, styleVisual }) {
  return (
    <>
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute left-[-12%] top-[18%] hidden h-[24rem] w-[36rem] rounded-[999px] border border-[#ffb36b]/12 md:block"
          animate={{ opacity: [0.14, 0.24, 0.14], rotate: [0, 2, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          style={{ filter: 'blur(0.5px)' }}
        />
        <motion.div
          className="absolute right-[-14%] top-[10%] hidden h-[22rem] w-[32rem] rounded-[999px] border border-[#f6c08d]/10 md:block"
          animate={{ opacity: [0.12, 0.22, 0.12], rotate: [0, -2, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
          style={{ filter: 'blur(0.5px)' }}
        />
        <motion.div
          className="absolute left-[-12%] top-[-18%] h-[42rem] w-[42rem] rounded-full"
          animate={{
            scale: [1, 1.08, 0.98, 1],
            opacity: [0.68, 0.92, 0.74, 0.68],
          }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            ...styleGlowA,
            background:
              'radial-gradient(circle, rgba(255,138,60,0.18) 0%, rgba(255,138,60,0.06) 42%, rgba(0,0,0,0) 74%)',
            filter: 'blur(52px)',
          }}
        />
        <motion.div
          className="absolute bottom-[-20%] right-[-8%] h-[34rem] w-[34rem] rounded-full"
          animate={{
            scale: [1, 0.96, 1.06, 1],
            opacity: [0.62, 0.78, 0.66, 0.62],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 1.6 }}
          style={{
            ...styleGlowB,
            background:
              'radial-gradient(circle, rgba(245,158,11,0.16) 0%, rgba(245,158,11,0.05) 48%, rgba(0,0,0,0) 76%)',
            filter: 'blur(58px)',
          }}
        />
        <motion.div
          className="absolute left-[22%] top-[10%] h-[24rem] w-[24rem] rounded-full"
          animate={{
            x: ['-2%', '3%', '-1%', '-2%'],
            y: ['0%', '4%', '-2%', '0%'],
            opacity: [0.14, 0.22, 0.16, 0.14],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            background:
              'radial-gradient(circle, rgba(255,223,191,0.08) 0%, rgba(255,179,107,0.03) 44%, rgba(0,0,0,0) 72%)',
            filter: 'blur(72px)',
          }}
        />
        <motion.div
          className="absolute inset-0 opacity-70"
          style={styleGrid}
          animate={{ opacity: [0.56, 0.7, 0.58, 0.56] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div
            className="h-full w-full"
            style={{
              backgroundImage:
                'linear-gradient(rgba(164,118,76,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(164,118,76,0.12) 1px, transparent 1px)',
              backgroundSize: '72px 72px',
              maskImage: 'radial-gradient(circle at center, black 32%, transparent 78%)',
            }}
          />
        </motion.div>

        <motion.div
          className="absolute inset-y-0 left-[-20%] w-[32%]"
          animate={{ x: ['0%', '250%'], opacity: [0, 0.9, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
          style={{
            background:
              'linear-gradient(90deg, rgba(0,0,0,0), rgba(255,179,107,0.1), rgba(0,0,0,0))',
            filter: 'blur(14px)',
          }}
        />

        {PARTICLES.map((particle) => (
          <motion.span
            key={`${particle.top}-${particle.left}`}
            className="absolute rounded-full bg-[#ffd4ad]/70"
            style={{
              top: particle.top,
              left: particle.left,
              width: particle.size,
              height: particle.size,
            }}
            animate={{
              y: [0, -12, 0],
              scale: [1, 1.22, 1],
              opacity: [0.12, 0.5, 0.12],
            }}
            transition={{
              duration: 6.2,
              delay: particle.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(100,58,24,0.18),transparent_38%),linear-gradient(180deg,rgba(5,5,5,0.22),rgba(5,5,5,0.9))]" />
        <div className="absolute inset-0 shadow-[inset_0_0_180px_rgba(0,0,0,0.55)]" />
        <div className="sb-noise opacity-[0.045]" />
      </div>

      <motion.div
        className="pointer-events-none absolute right-[6%] top-24 hidden h-[520px] w-[520px] rounded-full md:block"
        style={{
          ...styleVisual,
          background:
            'radial-gradient(circle, rgba(28,18,12,0.92) 0%, rgba(28,18,12,0.25) 52%, rgba(0,0,0,0) 72%)',
        }}
      />
    </>
  );
}

function HeroFlowLabel({ label, x, active = false }) {
  return (
    <motion.span
      className={`pointer-events-none absolute -translate-x-1/2 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.11em] ${
        active
          ? 'border-[#ffcf9a]/35 bg-[#ff8a3c]/[0.14] text-[#ffe3c6]'
          : 'border-white/15 bg-black/30 text-[#d5d0ca]'
      }`}
      style={{ left: x, top: '18%' }}
      animate={active ? { opacity: [0.78, 1, 0.78], y: [0, -1, 0] } : { opacity: [0.62, 0.84, 0.62] }}
      transition={{ duration: active ? 2.5 : 4.2, repeat: Infinity, ease: 'easeInOut' }}
    >
      {label}
    </motion.span>
  );
}

function HeroVisual() {
  const [isHovering, setIsHovering] = useState(false);
  const stageLabels = ['Input', 'Encrypt', 'Route', 'Execute', 'Settle'];
  const stageX = ['10%', '30%', '50%', '70%', '90%'];
  const dividerX = ['20%', '40%', '60%', '80%'];
  const particleDuration = isHovering ? 4.8 : 6.8;
  const trailDuration = isHovering ? 3.8 : 6.4;

  return (
    <div className="relative mx-auto flex h-[360px] w-full max-w-[380px] items-center justify-center sm:h-[410px] sm:max-w-[470px] md:h-[450px] md:max-w-[540px]">
      <motion.div
        className="relative h-[450px] w-[540px] origin-center scale-[0.64] sm:scale-[0.78] md:scale-100"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        animate={{ scale: isHovering ? 1.01 : 1 }}
        transition={{ duration: 0.3, ease: LUXURY_EASE }}
      >
        <div className="absolute inset-0 rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(16,12,10,0.82),rgba(10,8,7,0.86))] shadow-[0_24px_68px_rgba(0,0,0,0.34)] backdrop-blur-2xl" />
        <div className="absolute inset-5 rounded-[26px] border border-white/8 bg-[radial-gradient(circle_at_24%_16%,rgba(255,179,107,0.1),transparent_32%),radial-gradient(circle_at_80%_76%,rgba(95,171,255,0.08),transparent_34%),rgba(9,7,6,0.76)]" />
        <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#ffcf9a]/30 to-transparent" />

        <div className="absolute left-7 right-7 top-7 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#9f8b78]">
              Secure execution tunnel
            </p>
            <p className="mt-1 text-sm font-medium text-white">Private orderflow transport</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#ffb36b]/16 bg-[#ff8a3c]/[0.08] px-3 py-1.5 text-[11px] text-[#ffe0c2]">
            <span className="inline-flex h-2 w-2 rounded-full bg-[#ffb36b]" />
            Hidden pipeline
          </span>
        </div>

        <div className="absolute left-7 right-7 top-[86px] bottom-7 overflow-hidden rounded-[26px] border border-white/8 bg-[rgba(8,7,6,0.52)]">
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(167,118,76,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(167,118,76,0.12) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />
          <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#ffb36b]/20 to-transparent" />
          <div className="absolute left-8 top-8 h-24 w-24 rounded-full bg-[#ff8a3c]/[0.07] blur-[72px]" />
          <div className="absolute right-10 bottom-8 h-24 w-24 rounded-full bg-[#5ca8ff]/[0.07] blur-[74px]" />

          <motion.div
            className="absolute inset-0"
            animate={{ x: isHovering ? -6 : 0, y: isHovering ? -2 : 0 }}
            transition={{ duration: 0.35, ease: LUXURY_EASE }}
          >
            <div className="absolute left-5 right-5 top-1/2 h-[136px] -translate-y-1/2">
              <motion.div
                className="absolute inset-0 rounded-[999px] border border-white/12 bg-[linear-gradient(180deg,rgba(16,14,12,0.72),rgba(10,9,8,0.84))] backdrop-blur-2xl"
                animate={{
                  borderColor: isHovering ? 'rgba(255,179,107,0.24)' : 'rgba(255,255,255,0.12)',
                  boxShadow: isHovering
                    ? '0 0 36px rgba(255,138,60,0.18), 0 22px 54px rgba(0,0,0,0.28)'
                    : '0 16px 38px rgba(0,0,0,0.26)',
                }}
                transition={{ duration: 0.25, ease: LUXURY_EASE }}
              >
                <motion.div
                  className="absolute inset-[12px] rounded-[999px] border border-white/10 bg-[linear-gradient(90deg,rgba(255,138,60,0.08),rgba(95,171,255,0.09),rgba(255,189,133,0.08))]"
                  animate={{ opacity: isHovering ? [0.75, 1, 0.75] : [0.55, 0.78, 0.55] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                />

                <div className="absolute left-[10%] right-[10%] top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-gradient-to-r from-[#ffb36b]/35 via-[#79b8ff]/40 to-[#ffcf9a]/35" />
                <motion.div
                  className="absolute left-[10%] right-[10%] top-1/2 h-px -translate-y-1/2 border-t border-dashed border-[#79b8ff]/30"
                  animate={{ x: [0, -14, 0], opacity: [0.35, 0.6, 0.35] }}
                  transition={{ duration: trailDuration, repeat: Infinity, ease: 'linear' }}
                />

                {dividerX.map((x) => (
                  <div
                    key={x}
                    className="absolute top-5 bottom-5 w-px bg-gradient-to-b from-white/0 via-white/18 to-white/0"
                    style={{ left: x }}
                  />
                ))}

                {stageX.map((x, idx) => (
                  <div
                    key={x}
                    className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border"
                    style={{
                      left: x,
                      borderColor:
                        idx === 2
                          ? 'rgba(255,207,154,0.62)'
                          : idx === 4
                            ? 'rgba(159,212,255,0.66)'
                            : 'rgba(255,255,255,0.36)',
                      background:
                        idx === 2
                          ? 'rgba(255,138,60,0.46)'
                          : idx === 4
                            ? 'rgba(95,171,255,0.44)'
                            : 'rgba(255,255,255,0.18)',
                      boxShadow:
                        idx === 2
                          ? '0 0 14px rgba(255,138,60,0.34)'
                          : idx === 4
                            ? '0 0 14px rgba(95,171,255,0.3)'
                            : 'none',
                    }}
                  />
                ))}
              </motion.div>

              {stageLabels.map((label, idx) => (
                <HeroFlowLabel key={label} label={label} x={stageX[idx]} active={idx === 2} />
              ))}

              <motion.div
                className="pointer-events-none absolute top-1/2 h-10 w-7 -translate-x-1/2 -translate-y-1/2 rounded-md border border-[#79b8ff]/35 bg-[#79b8ff]/10"
                style={{ left: stageX[1] }}
                animate={{ opacity: [0.08, 0.15, 0.88, 0.18, 0.08], scaleY: [0.82, 0.88, 1.2, 0.92, 0.82] }}
                transition={{
                  duration: particleDuration,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  times: [0, 0.16, 0.26, 0.36, 1],
                }}
              />

              <motion.div
                className="pointer-events-none absolute top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#ffcf9a]/30"
                style={{ left: stageX[3] }}
                animate={{ opacity: [0.18, 0.18, 0.18, 0.85, 0.18], scale: [0.82, 0.82, 0.82, 1.24, 0.82] }}
                transition={{
                  duration: particleDuration,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  times: [0, 0.58, 0.67, 0.78, 1],
                }}
              />

              <motion.div
                className="pointer-events-none absolute top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#9fd4ff]/35"
                style={{ left: stageX[4] }}
                animate={{ opacity: [0.14, 0.14, 0.14, 0.78, 0.14], scale: [0.78, 0.78, 0.78, 1.16, 0.78] }}
                transition={{
                  duration: particleDuration,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  times: [0, 0.76, 0.86, 0.96, 1],
                }}
              />

              <motion.div
                className="pointer-events-none absolute top-1/2 z-[3] h-8 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff8a3c]/40 blur-[10px]"
                style={{ left: stageX[0] }}
                animate={{
                  left: stageX,
                  opacity: [0.26, 0.42, 0.5, 0.42, 0.24],
                  scaleX: [0.8, 1, 1.2, 1, 0.8],
                }}
                transition={{
                  duration: particleDuration,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  times: [0, 0.24, 0.48, 0.72, 1],
                }}
              />

              <motion.div
                className="pointer-events-none absolute top-1/2 z-[4] h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#ffdcb8]/60 bg-[radial-gradient(circle,rgba(255,226,196,0.95),rgba(255,138,60,0.5)_65%,rgba(255,138,60,0)_100%)]"
                style={{ left: stageX[0] }}
                animate={{
                  left: stageX,
                  scale: [0.9, 1.02, 1.14, 1.08, 0.92],
                  boxShadow: [
                    '0 0 12px rgba(255,138,60,0.24)',
                    '0 0 18px rgba(95,171,255,0.26)',
                    '0 0 22px rgba(255,138,60,0.32)',
                    '0 0 22px rgba(255,138,60,0.34)',
                    '0 0 18px rgba(95,171,255,0.28)',
                  ],
                }}
                transition={{
                  duration: particleDuration,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  times: [0, 0.24, 0.48, 0.72, 1],
                }}
              />
            </div>
          </motion.div>
        </div>
      </motion.div>

      <div className="absolute bottom-4 left-4 right-4 md:hidden">
        <motion.div
          className="rounded-2xl border border-white/10 bg-[rgba(16,12,10,0.78)] px-4 py-3 text-center backdrop-blur-xl"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.65, ease: LUXURY_EASE }}
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
            Secure flow
          </p>
          <p className="mt-2 font-mono text-[11px] text-slate-300">input → encrypt → route → execute → settle</p>
        </motion.div>
      </div>
    </div>
  );
}

function HeroSection() {
  const heroRef = useRef(null);
  const rafRef = useRef(null);
  const latestMouseRef = useRef({ normX: 0, normY: 0 });
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;

    const mediaQuery = window.matchMedia('(max-width: 1023px)');
    const update = () => setIsCompact(mediaQuery.matches);
    update();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', update);
      return () => mediaQuery.removeEventListener('change', update);
    }

    mediaQuery.addListener(update);
    return () => mediaQuery.removeListener(update);
  }, []);

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, { stiffness: 100, damping: 24, mass: 0.7 });
  const smoothY = useSpring(pointerY, { stiffness: 100, damping: 24, mass: 0.7 });

  const gridX = useTransform(smoothX, (value) => value * (isCompact ? 10 : 22));
  const gridY = useTransform(smoothY, (value) => value * (isCompact ? 8 : 16));
  const glowAX = useTransform(smoothX, (value) => value * (isCompact ? 18 : 42));
  const glowAY = useTransform(smoothY, (value) => value * (isCompact ? 12 : 30));
  const glowBX = useTransform(smoothX, (value) => value * (isCompact ? -14 : -34));
  const glowBY = useTransform(smoothY, (value) => value * (isCompact ? -10 : -24));
  const visualX = useTransform(smoothX, (value) => value * (isCompact ? 4 : 14));
  const visualY = useTransform(smoothY, (value) => value * (isCompact ? 4 : 10));

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  function flushMouse() {
    rafRef.current = null;
    pointerX.set(latestMouseRef.current.normX);
    pointerY.set(latestMouseRef.current.normY);
  }

  function handleMouseMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    latestMouseRef.current = {
      normX: event.clientX / rect.width - (rect.left / rect.width) - 0.5,
      normY: event.clientY / rect.height - (rect.top / rect.height) - 0.5,
    };
    if (!rafRef.current) rafRef.current = requestAnimationFrame(flushMouse);
  }

  function handleMouseLeave() {
    latestMouseRef.current = { normX: 0, normY: 0 };
    if (!rafRef.current) rafRef.current = requestAnimationFrame(flushMouse);
  }

  return (
    <section
      ref={heroRef}
      className="relative overflow-hidden px-4 pb-[4.5rem] pt-6 md:px-6 md:pb-28 md:pt-10"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <HeroBackdrop
        styleGrid={{ x: gridX, y: gridY }}
        styleGlowA={{ x: glowAX, y: glowAY }}
        styleGlowB={{ x: glowBX, y: glowBY }}
        styleVisual={{ x: visualX, y: visualY }}
      />

      <div className="sb-container relative z-[2] grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-14">
        <div className="max-w-[640px] pt-8 text-center lg:pt-16 lg:text-left">
          <motion.div
            className="mx-auto inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 backdrop-blur-xl lg:mx-0"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: LUXURY_EASE }}
          >
            <span className="inline-flex h-2 w-2 rounded-full bg-[#ffb36b]" />
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-300">
              Private trading infrastructure
            </span>
          </motion.div>

          <div className="mt-5 space-y-2">
            {['Invisible', 'Trading Layer'].map((line, index) => (
              <motion.h1
                key={line}
                className="font-display text-[3.45rem] font-semibold leading-[0.98] tracking-[-0.055em] text-white sm:text-6xl md:text-7xl"
                initial={{ opacity: 0, y: 28, filter: 'blur(12px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.95, delay: index * 0.1, ease: LUXURY_EASE }}
                style={{
                  textShadow:
                    index === 0
                      ? '0 12px 42px rgba(255,138,60,0.14)'
                      : '0 10px 32px rgba(255,255,255,0.06)',
                }}
              >
                <span
                  className={
                    index === 0
                      ? 'bg-gradient-to-r from-[#ffe0c2] via-[#ffb36b] to-[#ff8a3c] bg-clip-text text-transparent'
                      : ''
                  }
                >
                  {line}
                </span>
              </motion.h1>
            ))}
          </div>

          <motion.p
            className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-slate-300 md:text-xl lg:mx-0"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.72, delay: 0.2, ease: LUXURY_EASE }}
          >
            Execute trades without revealing intent, price, or amount before settlement.
          </motion.p>
          <motion.p
            className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-500 md:text-base lg:mx-0"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.72, delay: 0.28, ease: LUXURY_EASE }}
          >
            ShadowBook encrypts orders in the browser, routes encrypted payloads through a private execution path, and exposes only a proof-backed settlement record after completion.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-wrap justify-center gap-3 lg:justify-start"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.72, delay: 0.36, ease: LUXURY_EASE }}
          >
            <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.25, ease: LUXURY_EASE }}>
              <Link
                href="/app"
                className="group relative inline-flex w-full min-w-[200px] items-center justify-center overflow-hidden rounded-2xl border border-[#ffb36b]/16 bg-[linear-gradient(180deg,rgba(255,154,84,0.96),rgba(226,117,46,0.96))] px-5 py-3 text-sm font-medium text-white shadow-[0_18px_44px_rgba(255,138,60,0.16)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_22px_52px_rgba(255,138,60,0.22)] sm:w-auto"
              >
                <span className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#ffe0c2]/80 to-transparent opacity-80" />
                <span className="relative tracking-[0.01em]">Enter Workspace</span>
              </Link>
            </motion.div>
            <MagneticLink
              href="https://github.com/himanshukaushik9813/ShadowBook"
              className="group relative inline-flex w-full min-w-[170px] items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-slate-100 backdrop-blur-xl transition-colors duration-300 hover:bg-white/[0.05] sm:w-auto"
            >
              <span className="absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-[#ffb36b]/35 to-transparent opacity-70" />
              <span className="relative tracking-[0.01em]">View Docs</span>
            </MagneticLink>
          </motion.div>

          <motion.div
            className="mt-8 flex flex-wrap justify-center gap-4 text-xs text-slate-500 lg:justify-start"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.72, delay: 0.44, ease: LUXURY_EASE }}
          >
            <span>Encrypted before mempool</span>
            <span className="text-slate-700">/</span>
            <span>Hidden execution path</span>
            <span className="text-slate-700">/</span>
            <span>Proof-backed settlement</span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.95, delay: 0.24, ease: LUXURY_EASE }}
          style={{ x: visualX, y: visualY }}
        >
          <HeroVisual />
        </motion.div>
      </div>
    </section>
  );
}

function SectionReveal({ children, className = '' }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28, scale: 0.988 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.72, ease: LUXURY_EASE }}
    >
      {children}
    </motion.div>
  );
}

function SectionBridge() {
  return (
    <motion.div
      className="mx-auto h-px w-full max-w-[820px]"
      initial={{ opacity: 0, scaleX: 0.82 }}
      whileInView={{ opacity: 1, scaleX: 1 }}
      viewport={{ once: true, amount: 0.7 }}
      transition={{ duration: 0.8, ease: LUXURY_EASE }}
      style={{
        background:
          'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,179,107,0.2), rgba(245,158,11,0.14), rgba(255,255,255,0))',
      }}
    />
  );
}

function TrustCard({ item, index }) {
  return (
    <motion.div
      className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,13,10,0.84),rgba(10,8,7,0.82))] px-5 py-5 backdrop-blur-xl"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      whileHover={{
        y: -5,
        borderColor: 'rgba(255,179,107,0.18)',
        backgroundColor: 'rgba(255,255,255,0.05)',
      }}
      transition={{ duration: 0.42, delay: index * 0.08, ease: LUXURY_EASE }}
    >
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-80" />
      <div className="absolute right-5 top-5 h-14 w-14 rounded-full bg-[#ff8a3c]/[0.06] blur-2xl transition group-hover:bg-[#f59e0b]/[0.1]" />

      <div className="relative flex h-full flex-col">
        <div className="flex items-start gap-4">
          <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-[18px] border border-white/10 bg-black/20 shadow-[0_12px_24px_rgba(0,0,0,0.18)]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ffb36b] transition group-hover:bg-[#f6c08d]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-white">{item.label}</p>
              <span className="text-[11px] font-medium tracking-[0.12em] text-slate-600">
                SECURE
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.detail}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2 pt-4">
          <span className="h-px flex-1 bg-white/10" />
          <span className="text-[11px] text-slate-500">Core guarantee</span>
        </div>
      </div>
    </motion.div>
  );
}

function TrustStrip() {
  return (
    <section id="features" className="relative px-4 py-8 md:px-6 md:py-10">
      <div className="pointer-events-none absolute left-[8%] top-6 hidden h-48 w-48 rounded-full bg-[#ff8a3c]/[0.08] blur-[90px] md:block" />
      <div className="pointer-events-none absolute bottom-0 right-[10%] hidden h-48 w-48 rounded-full bg-[#f59e0b]/[0.06] blur-[100px] md:block" />

      <div className="sb-container relative z-[2]">
        <SectionBridge />
        <SectionReveal className="mt-6 overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,13,10,0.88),rgba(10,8,7,0.82))] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.24)] backdrop-blur-2xl md:p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.05),transparent_28%),radial-gradient(circle_at_82%_70%,rgba(255,138,60,0.1),transparent_24%)]" />
          <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#ffb36b]/25 to-transparent" />

          <div className="relative z-[2] grid gap-3 border-b border-white/8 pb-4 md:pb-5 lg:grid-cols-[minmax(0,1.12fr)_auto] lg:items-end">
            <div className="max-w-[680px]">
              <p className="sb-eyebrow">Core features</p>
              <h2 className="mt-2.5 font-display text-[1.95rem] font-semibold leading-[1.08] tracking-[-0.04em] text-white md:text-[2.35rem]">
                Built to hide intent from entry to settlement
              </h2>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-300">
              <span className="inline-flex h-2 w-2 rounded-full bg-[#ffb36b]" />
              Premium execution stack
            </div>
          </div>

          <div className="relative z-[2] mt-4 grid gap-3 md:grid-cols-3">
            {TRUST_ITEMS.map((item, index) => (
              <TrustCard key={item.label} item={item} index={index} />
            ))}
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}

function InfraTrustStrip() {
  return (
    <section className="relative px-4 py-3 md:px-6">
      <div className="sb-container">
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-full border border-white/8 bg-white/[0.02] px-5 py-3 text-[11px] tracking-[0.12em] text-slate-500 backdrop-blur-xl">
          {TRUST_LABELS.map((item, index) => (
            <div key={item} className="flex items-center gap-3">
              {index > 0 ? <span className="hidden h-1 w-1 rounded-full bg-[#ffb36b]/60 md:block" /> : null}
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ValueDeliverySection() {
  return (
    <section className="relative overflow-hidden px-4 py-20 md:px-6">
      <motion.div
        className="pointer-events-none absolute left-[10%] top-10 hidden h-48 w-48 rounded-full bg-[#ff8a3c]/[0.07] blur-[100px] md:block"
        animate={{ opacity: [0.26, 0.42, 0.26], x: [0, 16, 0], y: [0, -8, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute right-[8%] bottom-0 hidden h-56 w-56 rounded-full bg-[#f59e0b]/[0.05] blur-[110px] md:block"
        animate={{ opacity: [0.22, 0.38, 0.22], x: [0, -18, 0], y: [0, 10, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
      />
      <div className="sb-container">
        <SectionReveal className="relative grid gap-5 lg:grid-cols-3">
          {VALUE_ITEMS.map((item) => (
            <motion.div
              key={item.title}
              className="group relative overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,13,10,0.9),rgba(10,8,7,0.84))] p-7 shadow-[0_22px_58px_rgba(0,0,0,0.24)]"
              whileHover={{
                y: -5,
                borderColor: 'rgba(255,179,107,0.18)',
                boxShadow: '0 26px 62px rgba(255,138,60,0.1)',
              }}
              transition={{ duration: 0.32, ease: LUXURY_EASE }}
            >
              <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#ffb36b]/28 to-transparent" />
              <div className="absolute inset-x-6 top-3 h-8 rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0))] blur-xl" />
              <div className="absolute right-5 top-5 h-16 w-16 rounded-full bg-[#ff8a3c]/[0.06] blur-3xl transition duration-300 group-hover:bg-[#ff8a3c]/[0.1]" />
              <div className="relative">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#ffb36b]/18 bg-[linear-gradient(180deg,rgba(255,138,60,0.14),rgba(180,83,9,0.05))] text-[#ffe0c2] shadow-[0_12px_28px_rgba(255,138,60,0.08)]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ffb36b] shadow-[0_0_14px_rgba(255,179,107,0.35)]" />
                </span>
                <h3 className="mt-6 text-[1.28rem] font-semibold tracking-[-0.02em] text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{item.detail}</p>
              </div>
            </motion.div>
          ))}
        </SectionReveal>
      </div>
    </section>
  );
}

function TimelineStep({ item, index }) {
  return (
    <motion.div
      className="group relative overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,13,10,0.9),rgba(10,8,7,0.82))] p-6 shadow-[0_18px_42px_rgba(0,0,0,0.2)] backdrop-blur-xl"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      whileHover={{
        y: -6,
        borderColor: 'rgba(255,179,107,0.22)',
        boxShadow: '0 26px 56px rgba(0,0,0,0.28)',
      }}
      transition={{ duration: 0.45, delay: index * 0.08, ease: LUXURY_EASE }}
    >
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#ffe0c2]/40 to-transparent opacity-80" />
      <div className="absolute -top-10 right-4 h-24 w-24 rounded-full bg-[#ff8a3c]/[0.08] blur-3xl transition group-hover:bg-[#ff8a3c]/[0.12]" />
      <div className="relative flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/[0.03] font-mono text-sm text-[#f7f4ef]">
          0{index + 1}
        </span>
        <div className="min-w-0">
          <p className="text-lg font-semibold tracking-[-0.01em] text-white">{item.title}</p>
          <p className="mt-1 text-[11px] font-medium tracking-[0.14em] text-[#8f8377]">
            PRIVATE STEP
          </p>
        </div>
      </div>
      <p className="relative mt-4 text-sm leading-relaxed text-slate-300">{item.detail}</p>
      <div className="relative mt-6 flex items-center gap-2 pt-4">
        <span className="h-px flex-1 bg-gradient-to-r from-[#ffb36b]/0 via-[#ffb36b]/35 to-[#ffb36b]/0" />
        <span className="text-[11px] text-[#93897f]">Stage {index + 1}</span>
      </div>
    </motion.div>
  );
}

function FloatingCoin({ label, tone = 'orange', className = '', delay = 0 }) {
  const warm = tone === 'orange';

  return (
    <motion.div
      className={`pointer-events-none absolute flex h-11 w-11 items-center justify-center rounded-full border text-[10px] font-semibold tracking-[0.08em] ${className} ${
        warm
          ? 'border-[#ffb36b]/35 bg-[linear-gradient(180deg,rgba(255,138,60,0.26),rgba(26,18,13,0.9))] text-[#ffe2c4]'
          : 'border-[#79b8ff]/35 bg-[linear-gradient(180deg,rgba(83,166,255,0.2),rgba(10,14,20,0.9))] text-[#d7ecff]'
      }`}
      animate={{
        y: [0, -7, 0],
        rotate: [0, warm ? 6 : -6, 0],
        boxShadow: warm
          ? [
              '0 0 0 rgba(255,138,60,0.0)',
              '0 0 26px rgba(255,138,60,0.26)',
              '0 0 0 rgba(255,138,60,0.0)',
            ]
          : [
              '0 0 0 rgba(83,166,255,0.0)',
              '0 0 24px rgba(83,166,255,0.24)',
              '0 0 0 rgba(83,166,255,0.0)',
            ],
      }}
      transition={{ duration: 8.2, delay, repeat: Infinity, ease: 'easeInOut' }}
    >
      {label}
    </motion.div>
  );
}

function HowItWorksVisualPanel() {
  const routePath = 'M58 208 C110 162 140 126 168 118 C210 106 222 186 252 226 C276 258 307 216 338 170 C368 126 416 112 455 122';
  const altPath = 'M58 208 C102 184 132 150 178 160 C216 168 241 198 282 188 C324 176 365 144 455 122';

  return (
    <motion.div
      className="relative mx-auto w-full max-w-[590px] overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,14,10,0.94),rgba(9,8,7,0.9))] p-5 shadow-[0_26px_72px_rgba(0,0,0,0.3)] backdrop-blur-xl md:p-6"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.5, ease: LUXURY_EASE }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_14%,rgba(255,138,60,0.16),transparent_28%),radial-gradient(circle_at_80%_82%,rgba(245,158,11,0.08),transparent_26%)]" />
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(167,118,76,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(167,118,76,0.1) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#ffb36b]/30 to-transparent" />
      <motion.div
        className="pointer-events-none absolute left-[-10%] top-[22%] h-24 w-24 rounded-full bg-[#ff8a3c]/[0.1] blur-[72px]"
        animate={{ opacity: [0.34, 0.52, 0.34], x: [0, 8, 0], y: [0, -6, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#9a8773]">
            Private execution flow
          </p>
          <p className="mt-1 text-sm font-semibold text-white">
            No mempool exposure. No visible intent. Fully sealed execution.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-[#ffb36b]/18 bg-[#ff8a3c]/[0.1] px-3 py-1.5 text-[11px] font-medium text-[#ffe0c2]">
          <span className="inline-flex h-2 w-2 rounded-full bg-[#ffb36b]" />
          Protected route active
        </span>
      </div>

      <div className="relative mt-5 overflow-hidden rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(11,9,7,0.72),rgba(8,7,6,0.58))] p-4 md:p-5">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(167,118,76,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(167,118,76,0.1) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#ffb36b]/24 to-transparent" />
        <div className="pointer-events-none absolute left-4 top-[38%] h-24 w-16 rounded-full bg-[#ff8a3c]/[0.1] blur-3xl" />
        <div className="pointer-events-none absolute right-6 top-[62%] h-24 w-16 rounded-full bg-[#5ca8ff]/[0.08] blur-3xl" />

        <div className="relative h-[300px] overflow-hidden rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,9,8,0.68),rgba(9,8,7,0.5))] md:h-[320px]">
          <FloatingCoin label="ETH" className="left-[12%] top-[11%]" delay={0.1} />
          <FloatingCoin label="SB" className="right-[15%] top-[14%]" delay={0.8} />
          <FloatingCoin label="TKN" tone="blue" className="right-[9%] bottom-[15%]" delay={1.4} />

          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 520 320"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="sbRouteGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255,138,60,0.26)" />
                <stop offset="42%" stopColor="rgba(95,171,255,0.28)" />
                <stop offset="100%" stopColor="rgba(255,190,132,0.32)" />
              </linearGradient>
            </defs>

            <path
              d={routePath}
              stroke="url(#sbRouteGradient)"
              strokeWidth="2.4"
              fill="none"
              strokeLinecap="round"
              style={{ filter: 'drop-shadow(0 0 10px rgba(255,138,60,0.25))' }}
            />

            <motion.path
              d={altPath}
              stroke="rgba(255,190,132,0.28)"
              strokeWidth="1.4"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="6 8"
              animate={{ strokeDashoffset: [0, -180] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            />
          </svg>

          <motion.div
            className="pointer-events-none absolute z-[4] h-4 w-4 rounded-full border border-[#ffdcb8]/50 bg-[radial-gradient(circle,rgba(255,222,190,0.95),rgba(255,138,60,0.4)_65%,rgba(255,138,60,0)_100%)]"
            style={{ left: 50, top: 200 }}
            animate={{
              x: [0, 110, 194, 280, 397],
              y: [0, -88, 16, -42, -80],
              scale: [0.9, 1.06, 1.14, 1, 0.92],
            }}
            transition={{ duration: 6.6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="pointer-events-none absolute z-[3] h-8 w-8 rounded-full bg-[#ff8a3c]/40 blur-[10px]"
            style={{ left: 44, top: 194 }}
            animate={{
              x: [0, 110, 194, 280, 397],
              y: [0, -88, 16, -42, -80],
              opacity: [0.24, 0.42, 0.5, 0.36, 0.24],
            }}
            transition={{ duration: 6.6, repeat: Infinity, ease: 'easeInOut' }}
          />

          <motion.div
            className="pointer-events-none absolute z-[3] rounded-lg border border-[#79b8ff]/32 bg-[#79b8ff]/10 px-2 py-1 text-[9px] font-medium tracking-[0.12em] text-[#d7ecff]"
            style={{ left: 140, top: 86 }}
            animate={{ opacity: [0.2, 1, 0.25], scale: [0.92, 1, 0.96] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            ENCRYPT
          </motion.div>

          <div className="pointer-events-none absolute inset-0">
            {HOW_IT_WORKS_VISUAL_STEPS.map((step) => {
              const style = {
                left: `${(step.x / 520) * 100}%`,
                top: `${(step.y / 320) * 100}%`,
              };

              return (
                <div
                  key={step.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={style}
                >
                  {step.core ? (
                    <div className="relative">
                      <motion.div
                        className="absolute inset-[-18px] rounded-full border border-[#ffb36b]/20"
                        animate={{ scale: [0.9, 1.08, 0.9], opacity: [0.35, 0.64, 0.35] }}
                        transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-[#ffcf9a]/40 bg-[radial-gradient(circle,rgba(255,168,102,0.34),rgba(18,13,10,0.92)_70%)] shadow-[0_0_26px_rgba(255,138,60,0.28)]">
                        <span className="h-2 w-2 rounded-full bg-[#ffe2c4]" />
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                        step.highlight
                          ? 'border-[#ffcf9a]/55 bg-[#ff8a3c]/[0.42] shadow-[0_0_18px_rgba(255,138,60,0.36)]'
                          : step.final
                            ? 'border-[#9fd4ff]/52 bg-[#5ca8ff]/[0.32] shadow-[0_0_16px_rgba(95,171,255,0.3)]'
                            : 'border-white/35 bg-white/18'
                      }`}
                    />
                  )}

                  <div className="mt-2.5 min-w-[74px] text-center">
                    <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#f3e3d4]">
                      {step.label}
                    </p>
                    <p className="mt-0.5 text-[10px] text-[#9f9488]">{step.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative px-4 py-24 md:px-6">
      <div className="pointer-events-none absolute left-[10%] top-20 hidden h-64 w-64 rounded-full bg-[#ff8a3c]/[0.06] blur-[115px] md:block" />
      <div className="pointer-events-none absolute bottom-16 right-[10%] hidden h-64 w-64 rounded-full bg-[#f59e0b]/[0.05] blur-[120px] md:block" />

      <div className="sb-container relative">
        <SectionBridge />
        <SectionReveal className="mt-8 overflow-hidden rounded-[38px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,13,10,0.9),rgba(10,8,7,0.83))] p-6 shadow-[0_26px_78px_rgba(0,0,0,0.3)] backdrop-blur-2xl md:p-8 lg:p-9">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_34%),radial-gradient(circle_at_16%_72%,rgba(255,138,60,0.11),transparent_24%),radial-gradient(circle_at_84%_22%,rgba(245,158,11,0.08),transparent_26%)]" />
          <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#ffb36b]/26 to-transparent" />

          <div className="relative z-[2] grid gap-10 border-b border-white/10 pb-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center">
            <div className="w-full min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.03] px-3 py-1.5">
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[#f6c08d]" />
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#aa9a8b]">How it works</p>
              </div>

              <h2 className="mt-5 max-w-3xl font-display text-[2.2rem] font-semibold leading-[1.02] tracking-[-0.045em] text-white sm:text-[2.55rem] md:text-[3.05rem] xl:text-[3.35rem]">
                A private path from order to settlement
              </h2>

              <p className="mt-5 max-w-[35rem] text-base leading-relaxed text-[#b7b0a8] md:text-[1.02rem]">
                ShadowBook transforms raw intent into encrypted orderflow, routes it through a protected execution path, and finishes with a proof-backed settlement record.
              </p>

              <div className="mt-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/12 bg-white/[0.03] px-3.5 py-1.5 text-xs text-slate-200">
                <span className="inline-flex h-2 w-2 rounded-full bg-[#ffb36b]" />
                Five-stage protected workflow
              </div>
            </div>
            <HowItWorksVisualPanel />
          </div>

          <div className="relative z-[2] mt-12 grid gap-6 lg:grid-cols-3">
            <div className="pointer-events-none absolute left-[16%] right-[16%] top-[42px] hidden h-px bg-gradient-to-r from-[#ffb36b]/0 via-[#ffb36b]/34 to-[#ffb36b]/0 lg:block" />
            <motion.div
              className="pointer-events-none absolute top-[38px] hidden h-2.5 w-2.5 rounded-full bg-[#ffb36b] shadow-[0_0_18px_rgba(255,138,60,0.3)] lg:block"
              initial={{ x: '16%' }}
              whileInView={{ x: ['0%', '36%', '72%'] }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 5.4, repeat: Infinity, ease: 'easeInOut' }}
            />
            {TIMELINE_STEPS.map((item, index) => (
              <TimelineStep key={item.title} item={item} index={index} />
            ))}
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}

function CipherText({ active }) {
  const [display, setDisplay] = useState('a9F#4xL2::eK8');

  useEffect(() => {
    const values = ['a9F#4xL2::eK8', 'Q2m$8Pq1::nV4', '8Xz@3Lm7::cR2'];
    let index = 0;

    const interval = setInterval(() => {
      index = (index + 1) % values.length;
      setDisplay(values[index]);
    }, 950);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.p
      className={`font-mono text-[13px] ${active ? 'text-[#ffe0c2]' : 'text-slate-400'}`}
      animate={{ opacity: active ? [0.6, 1, 0.6] : 1 }}
      transition={{ duration: 2.8, repeat: Infinity }}
    >
      {display}
    </motion.p>
  );
}

function PreviewStage({ title, meta, children, active, complete }) {
  return (
    <motion.div
      className={`relative overflow-hidden rounded-3xl border p-5 ${
        active
          ? 'border-[#ffb36b]/18 bg-[#ff8a3c]/[0.08]'
          : complete
            ? 'border-white/12 bg-white/[0.035]'
            : 'border-white/10 bg-white/[0.02]'
      }`}
      animate={{
        y: active ? -4 : 0,
        boxShadow: active
          ? '0 18px 42px rgba(255,138,60,0.12)'
          : complete
            ? '0 14px 34px rgba(0,0,0,0.16)'
            : '0 10px 26px rgba(0,0,0,0.12)',
      }}
      transition={{ duration: 0.4, ease: LUXURY_EASE }}
    >
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-70" />
      <p className="text-xs font-medium text-slate-500">{meta}</p>
      <h3 className="mt-2 text-lg font-semibold text-white">{title}</h3>
      <div className="mt-5">{children}</div>
    </motion.div>
  );
}

function PreviewConnector({ mobile = false }) {
  if (mobile) {
    return (
      <div className="flex h-10 items-center justify-center lg:hidden">
        <div className="relative h-full w-px overflow-hidden bg-white/10">
          <motion.span
            className="absolute left-1/2 top-0 h-4 w-4 -translate-x-1/2 rounded-full bg-[#ffb36b]/80 blur-[1px]"
            animate={{ y: ['0%', '165%'], opacity: [0, 1, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="hidden lg:block">
      <div className="relative h-[2px] w-20 overflow-hidden rounded-full bg-[#ffb36b]/14">
        <motion.span
          className="absolute inset-y-0 left-[-30%] w-[28%] rounded-full"
          animate={{ x: ['0%', '460%'] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
          style={{
            background:
              'linear-gradient(90deg, rgba(255,138,60,0), rgba(255,179,107,0.9), rgba(245,158,11,0))',
          }}
        />
      </div>
    </div>
  );
}

function WowFactorSection() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((current) => (current + 1) % 4);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="preview" className="relative px-4 py-20 md:px-6">
      <div className="pointer-events-none absolute left-[-10%] top-20 hidden h-72 w-72 rounded-full bg-[#ff8a3c]/10 blur-[110px] md:block" />
      <div className="pointer-events-none absolute bottom-10 right-[-8%] hidden h-80 w-80 rounded-full bg-[#f59e0b]/10 blur-[120px] md:block" />

      <div className="sb-container relative">
        <div className="max-w-2xl">
          <p className="sb-eyebrow">Private flow preview</p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.04em] text-white md:text-5xl">
            Live Encrypted Execution
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-400 md:text-base">
            The transition from plain order to proof-backed settlement should feel visible, controlled, and trustworthy.
          </p>
        </div>

        <div className="relative mt-12 overflow-hidden rounded-[36px] border border-white/10 bg-[linear-gradient(180deg,rgba(16,12,10,0.84),rgba(10,8,7,0.8))] p-5 shadow-[0_22px_70px_rgba(0,0,0,0.28)] backdrop-blur-2xl md:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_34%),radial-gradient(circle_at_75%_30%,rgba(255,138,60,0.12),transparent_26%),radial-gradient(circle_at_18%_78%,rgba(245,158,11,0.08),transparent_28%)]" />
          <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#ffb36b]/25 to-transparent" />
          <motion.div
            className="pointer-events-none absolute inset-y-0 left-[-18%] w-[22%]"
            animate={{ x: ['0%', '440%'] }}
            transition={{ duration: 8.8, repeat: Infinity, ease: 'linear' }}
            style={{
              background:
                'linear-gradient(90deg, rgba(0,0,0,0), rgba(255,179,107,0.1), rgba(0,0,0,0))',
            }}
          />
          <motion.div
            className="absolute right-6 top-6 hidden h-24 w-24 rounded-full md:block"
            animate={{ opacity: [0.16, 0.26, 0.16], scale: [0.96, 1.04, 0.96] }}
            transition={{ duration: 7.4, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              background:
                'radial-gradient(circle, rgba(255,138,60,0.18) 0%, rgba(255,138,60,0.04) 46%, rgba(0,0,0,0) 74%)',
              filter: 'blur(14px)',
            }}
          />

          <div className="relative z-[2] flex flex-col gap-6">
            <div className="mb-6 flex flex-col items-start justify-start gap-2 border-b border-white/8 pb-5 text-left">
              <div className="w-full">
                <p className="text-xs font-medium tracking-[0.16em] text-slate-500">Execution path</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white md:text-3xl">
                  Plain order to verified settlement
                </h3>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-300">
                <span className="inline-flex h-2 w-2 rounded-full bg-[#ffb36b]" />
                Simulated live sequence
                </span>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] lg:items-center">
            <PreviewStage title="Plain order" meta="Input" active={step === 0} complete={step > 0}>
              <p className="text-sm text-slate-300">Buy 2 ETH @ 3200</p>
            </PreviewStage>

            <PreviewConnector />
            <PreviewConnector mobile />

            <PreviewStage title="Encrypted payload" meta="Cipher" active={step === 1} complete={step > 1}>
              <CipherText active={step >= 1} />
            </PreviewStage>

            <PreviewConnector />
            <PreviewConnector mobile />

            <PreviewStage title="Private route" meta="Execution path" active={step === 2} complete={step > 2}>
              <div className="space-y-2">
                {[0, 1, 2].map((item) => (
                  <motion.div
                    key={item}
                    className="h-2 rounded-full bg-white/10"
                    animate={{
                      opacity: step >= 2 ? [0.2, 0.9, 0.2] : 0.25,
                      scaleX: step >= 2 ? [0.92, 1, 0.92] : 1,
                    }}
                    transition={{ duration: 2.2, repeat: Infinity, delay: item * 0.2 }}
                  />
                ))}
              </div>
            </PreviewStage>

            <PreviewConnector />
            <PreviewConnector mobile />

            <PreviewStage title="Verified settlement" meta="Result" active={step === 3} complete={step > 3}>
              <motion.div
                className="inline-flex items-center gap-2 rounded-full border border-[#ffb36b]/18 bg-[#ff8a3c]/[0.08] px-3 py-1.5 text-sm text-[#ffe0c2]"
                animate={{ opacity: step >= 3 ? [0.6, 1, 0.6] : 0.55 }}
                transition={{ duration: 2.8, repeat: Infinity }}
              >
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#ffb36b]" />
                Settlement confirmed
              </motion.div>
            </PreviewStage>
            </div>

            <div className="grid gap-3 border-t border-white/8 pt-5 md:grid-cols-3">
              {[
                'Order never enters a public mempool.',
                'Execution path stays opaque until settlement.',
                'Proof state becomes visible after confirmation.',
              ].map((item, index) => (
                <motion.div
                  key={item}
                  className="rounded-2xl border border-white/8 bg-black/10 px-4 py-3 text-sm text-slate-400"
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.45, delay: 0.12 + index * 0.08, ease: LUXURY_EASE }}
                >
                  {item}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative px-4 pb-20 pt-10 md:px-6">
      <div className="sb-container">
        <motion.div
          className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,13,10,0.88),rgba(10,8,7,0.82))] p-8 backdrop-blur-2xl md:p-10"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4 }}
        >
          <div className="pointer-events-none absolute left-1/2 top-[-56%] h-[520px] w-[1120px] -translate-x-1/2 rounded-[999px] border border-[#ffcf9a]/10" />
          <div className="pointer-events-none absolute left-1/2 top-[-46%] h-[450px] w-[980px] -translate-x-1/2 rounded-[999px] border border-white/6" />
          <div className="pointer-events-none absolute left-1/2 top-[-18%] h-[260px] w-[260px] -translate-x-1/2 rounded-full bg-[#ff8a3c]/[0.08] blur-[120px]" />
          <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-[#ffb36b]/25 to-transparent" />
          <div className="relative z-[2] mx-auto flex max-w-[720px] flex-col items-center text-center">
            <p className="sb-eyebrow">Final CTA</p>
            <h2 className="mt-3 max-w-3xl font-display text-4xl font-semibold tracking-[-0.04em] text-white md:text-5xl">
              Ready to launch private execution?
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-400 md:text-base">
              Move from hidden orderflow to proof-backed settlement inside one premium execution layer.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/app" className="inline-flex min-w-[200px] items-center justify-center rounded-2xl border border-[#ffb36b]/16 bg-[linear-gradient(180deg,rgba(255,154,84,0.96),rgba(226,117,46,0.96))] px-5 py-3 text-sm font-medium text-white shadow-[0_18px_44px_rgba(255,138,60,0.16)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_22px_52px_rgba(255,138,60,0.22)]">
                Launch App
              </Link>
              <MagneticLink
                href="https://github.com/himanshukaushik9813/ShadowBook"
                className="sb-button-ghost min-w-[170px] justify-center"
              >
                View Docs
              </MagneticLink>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default function MarketingLanding() {
  return (
    <div id="top" className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,140,0,0.08),rgba(255,140,0,0.03)_24%,rgba(0,0,0,0)_56%)]" />
      <div className="absolute inset-0 shadow-[inset_0_0_180px_rgba(0,0,0,0.72)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(167,118,76,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(167,118,76,0.14) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(circle at center, black 18%, transparent 78%)',
        }}
      />
      <LandingNavbar />
      <main className="relative">
        <HeroSection />
        <TrustStrip />
        <InfraTrustStrip />
        <HowItWorksSection />
        <ValueDeliverySection />
        <WowFactorSection />
        <FinalCta />
      </main>
    </div>
  );
}
