'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAccount, useChainId } from 'wagmi';

import { IS_DEPLOYED, SHADOWBOOK_ADDRESS } from '../../constants/config';
import { networkLabel, shortenAddress } from '../../constants/network';
import BrandSignature from '../BrandSignature';
import { useAppWorkspace } from './AppWorkspaceContext';

const NAV_ITEMS = [
  { key: 'trade', title: 'Trade', href: '/app/trade', icon: 'trade' },
  { key: 'proofs', title: 'Proofs', href: '/app/proofs', icon: 'proofs' },
  { key: 'assistant', title: 'Assistant', href: '/app/assistant', icon: 'assistant' },
  { key: 'settings', title: 'Settings', href: '/app/settings', icon: 'settings' },
];

function NavIcon({ name, active }) {
  const stroke = active ? '#ffe0c2' : '#7f7368';

  if (name === 'trade') {
    return (
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
        <path d="M4 6h12M4 10h12M4 14h8" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === 'proofs') {
    return (
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
        <path d="M6 4h8v12H6z" stroke={stroke} strokeWidth="1.5" />
        <path d="M8 8h4M8 11h4" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === 'assistant') {
    return (
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
        <path d="M6.5 6.5h7v5h-7z" stroke={stroke} strokeWidth="1.5" />
        <path d="M8 13.5h4M10 4v2M4 10h2M14 10h2" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
      <path
        d="M10 4.5l1.2 1.1 1.6-.1.7 1.5 1.4.8-.4 1.6.4 1.6-1.4.8-.7 1.5-1.6-.1L10 15.5l-1.2-1.1-1.6.1-.7-1.5-1.4-.8.4-1.6-.4-1.6 1.4-.8.7-1.5 1.6.1z"
        stroke={stroke}
        strokeWidth="1.2"
      />
      <circle cx="10" cy="10" r="2" stroke={stroke} strokeWidth="1.2" />
    </svg>
  );
}

function WorkspaceMark() {
  return (
    <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-[16px] border border-[#ffcf9a]/12 bg-[linear-gradient(180deg,rgba(28,20,15,0.98),rgba(14,11,9,0.96))] shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_16px_34px_rgba(0,0,0,0.22)]">
      <span className="absolute inset-[7px] rounded-[12px] border border-white/8 bg-[radial-gradient(circle_at_30%_22%,rgba(255,179,107,0.12),transparent_56%)]" />
      <span className="absolute inset-[11px] rotate-45 rounded-[5px] border border-[#ffcf9a]/16 bg-[linear-gradient(180deg,rgba(255,179,107,0.08),rgba(180,83,9,0.03))]" />
      <span className="relative h-2.5 w-2.5 rotate-45 rounded-[3px] bg-[#ffb36b] shadow-[0_0_12px_rgba(255,138,60,0.18)]" />
      <span className="absolute bottom-[8px] right-[8px] h-1 w-1 rounded-full bg-[#ffe0c2]" />
    </span>
  );
}

function WorkspaceMetaPill({ label, value, mono = false }) {
  return (
    <span className="inline-flex h-9 items-center gap-2 rounded-full border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] px-3.5 text-[12px] text-[#c5bbb0] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <span className="text-[11px] text-[#8f7f71]">{label}</span>
      <span className={mono ? 'font-mono text-[12px] text-[#f0e7de]' : 'text-[#f0e7de]'}>
        {value}
      </span>
    </span>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
      <path d="M4 6h12M4 10h12M4 14h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
      <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function MobileAppBar({ onOpenMenu }) {
  return (
    <div className="sticky top-3 z-[35] mb-5 md:hidden">
      <div className="relative overflow-hidden rounded-[22px] border border-[#ffcf9a]/12 bg-[linear-gradient(180deg,rgba(20,15,13,0.9),rgba(13,10,9,0.86))] px-4 py-3 shadow-[0_20px_48px_rgba(0,0,0,0.28)] backdrop-blur-[14px]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,179,107,0.06),rgba(255,255,255,0.01)_30%,transparent_62%)]" />
        <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#ffb36b]/26 to-transparent" />

        <div className="relative flex items-center justify-between gap-3">
          <BrandSignature href="/" subtitle="Private execution" compact tone="warm" />
          <button
            type="button"
            onClick={onOpenMenu}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 text-sm text-[#d4cbc2] transition-colors duration-200 hover:border-[#ffb36b]/18 hover:text-white"
          >
            <MenuIcon />
            Menu
          </button>
        </div>
      </div>
    </div>
  );
}

function SidebarContent({ activeSection, onNavigate, onClose }) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  return (
    <div className="relative flex h-full flex-col overflow-hidden px-4 py-5">
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#ffb36b]/18 to-transparent" />
      <div className="absolute left-[-40px] top-16 h-28 w-28 rounded-full bg-[#ff8a3c]/[0.05] blur-[72px]" />
      <div className="absolute bottom-10 right-[-54px] h-32 w-32 rounded-full bg-[#f59e0b]/[0.04] blur-[84px]" />
      <div className="absolute right-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />

      <div className="relative z-[2] flex items-center justify-between gap-3 px-2">
        <BrandSignature href="/" subtitle="Private execution" compact tone="warm" />
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-[#d4cbc2] transition-colors duration-200 hover:border-[#ffb36b]/18 hover:text-white md:hidden"
            aria-label="Close navigation"
          >
            <CloseIcon />
          </button>
        ) : null}
      </div>

      <nav className="relative z-[2] mt-8 space-y-1.5">
        {NAV_ITEMS.map((item) => {
          const active = activeSection === item.key;
          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={() => {
                if (onNavigate) onNavigate();
                if (onClose) onClose();
              }}
              className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all duration-200 ${
                active
                  ? 'border-[#ffb36b]/16 bg-[#ff8a3c]/[0.07] text-white'
                  : 'border-transparent text-[#9f9387] hover:border-white/8 hover:bg-[#12100e] hover:text-white'
              }`}
            >
              <span className={`h-8 w-0.5 rounded-full ${active ? 'bg-[#ffb36b]' : 'bg-transparent'}`} />
              <NavIcon name={item.icon} active={active} />
              <span className="text-sm font-medium">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="relative z-[2] mt-auto rounded-2xl border border-white/8 bg-[rgba(18,14,11,0.76)] px-4 py-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#8f7f71]">
          Status
        </p>
        <div className="mt-3 space-y-2">
          <p className="text-sm text-white">
            {isConnected ? 'Wallet connected' : 'Wallet not connected'}
          </p>
          <p className="font-mono text-xs text-[#8e877e]">
            {isConnected ? shortenAddress(address) : 'Awaiting session'}
          </p>
          <p className="text-xs text-[#8e877e]">
            {isConnected ? networkLabel(chainId) : 'Fhenix Helium'}
          </p>
        </div>
        <div className="mt-4 border-t border-white/8 pt-3 text-[11px] text-[#6f6a64]">
          ShadowBook v1.0
        </div>
      </div>
    </div>
  );
}

function AppSidebar({ activeSection, onNavigate }) {
  return (
    <aside className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-[260px] flex-col border-r border-white/10 bg-[#070606] shadow-[20px_0_60px_rgba(0,0,0,0.28)]">
      <SidebarContent activeSection={activeSection} onNavigate={onNavigate} />
    </aside>
  );
}

function MobileSidebarDrawer({ open, activeSection, onNavigate, onClose }) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            className="fixed inset-0 z-[44] bg-black/60 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-label="Close navigation overlay"
          />
          <motion.aside
            className="fixed inset-y-0 left-0 z-[45] flex w-[86vw] max-w-[300px] flex-col border-r border-white/10 bg-[linear-gradient(180deg,rgba(11,9,8,0.99),rgba(7,6,6,1))] shadow-[24px_0_80px_rgba(0,0,0,0.38)] md:hidden"
            initial={{ x: -24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -24, opacity: 0 }}
            transition={{ duration: 0.24 }}
          >
            <SidebarContent
              activeSection={activeSection}
              onNavigate={onNavigate}
              onClose={onClose}
            />
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function DashboardHeader({ activeSection, onConnectWallet }) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { institutionMode } = useAppWorkspace();

  const title = NAV_ITEMS.find((item) => item.key === activeSection)?.title || 'Trade';

  return (
    <header className="mb-5 md:mb-6">
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,rgba(20,16,14,0.94),rgba(11,9,8,0.92))] px-4 py-4 shadow-[0_22px_54px_rgba(0,0,0,0.28)] backdrop-blur-[14px] md:px-6 md:py-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_50%,rgba(255,138,60,0.1),transparent_24%),linear-gradient(120deg,rgba(255,255,255,0.025),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_24%)]" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(167,118,76,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(167,118,76,0.12) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            maskImage: 'linear-gradient(90deg, black 0%, black 76%, transparent 100%)',
          }}
        />
        <div className="absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-[#ffcf9a]/26 to-transparent" />
        <div className="absolute left-12 top-1/2 hidden h-12 w-24 -translate-y-1/2 rounded-full bg-[#ff8a3c]/[0.08] blur-3xl xl:block" />
        <div className="absolute right-16 top-1/2 hidden h-16 w-32 -translate-y-1/2 rounded-full bg-[#f59e0b]/[0.04] blur-[72px] xl:block" />
        <div className="absolute inset-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),inset_0_-30px_60px_rgba(0,0,0,0.16)]" />

        <div className="relative grid gap-4 2xl:grid-cols-[minmax(0,1fr)_auto] 2xl:items-center">
          <Link href="/" className="group min-w-0 transition-opacity hover:opacity-95">
            <div className="inline-flex max-w-full items-center gap-4 rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] md:px-5">
              <WorkspaceMark />
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#a99684]">
                  ShadowBook
                </p>
                <p className="mt-1 truncate text-[1.05rem] font-semibold tracking-[-0.025em] text-white md:text-[1.15rem]">
                  {title}
                </p>
              </div>
            </div>
          </Link>

          <div className="w-full max-w-full rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.028),rgba(255,255,255,0.012))] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] 2xl:min-w-[430px] 2xl:max-w-[620px] 2xl:justify-self-end">
            <div className="flex flex-col gap-3 2xl:items-end">
              <div className="flex flex-wrap items-center gap-2.5 2xl:justify-end">
                <WorkspaceMetaPill
                  label="Contract"
                  value={
                    IS_DEPLOYED
                      ? `${SHADOWBOOK_ADDRESS.slice(0, 6)}...${SHADOWBOOK_ADDRESS.slice(-4)}`
                      : 'Not deployed'
                  }
                  mono
                />
                <WorkspaceMetaPill label="Network" value={networkLabel(chainId)} />
                {institutionMode ? (
                  <span className="inline-flex h-9 items-center gap-2 rounded-full border border-[#ffb36b]/16 bg-[#ff8a3c]/[0.08] px-3.5 text-[12px] text-[#ffe0c2] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                    <span className="inline-flex h-2 w-2 rounded-full bg-[#ffb36b]" />
                    Auditor access enabled
                  </span>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2.5 2xl:justify-end">
                {isConnected ? (
                  <button
                    type="button"
                    className="inline-flex h-10 cursor-default items-center gap-2.5 rounded-full border border-white/10 bg-[linear-gradient(180deg,rgba(17,15,13,0.88),rgba(12,10,9,0.82))] px-4 text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_14px_30px_rgba(0,0,0,0.18)]"
                    disabled
                    aria-disabled="true"
                  >
                    <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#66d17e] shadow-[0_0_10px_rgba(102,209,126,0.42)]" />
                    <span>Connected</span>
                    <span className="font-mono text-xs text-[#bcb3aa]">{shortenAddress(address)}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="inline-flex h-10 items-center justify-center rounded-full border border-[#ffb36b]/16 bg-[linear-gradient(180deg,rgba(20,16,14,0.88),rgba(12,10,9,0.86))] px-4 text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_14px_30px_rgba(0,0,0,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#ffcf9a]/24 hover:bg-[#ff8a3c]/[0.06] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_18px_36px_rgba(255,138,60,0.12)]"
                    onClick={onConnectWallet}
                  >
                    Connect Wallet
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function AppShell({ children }) {
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const activeSection = pathname.split('/')[2] || 'trade';

  function handleOpenWallet() {
    setMobileSidebarOpen(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent('shadowbook:open-wallet'));
      }, 40);
    }
  }

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = mobileSidebarOpen ? 'hidden' : previousOverflow || '';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileSidebarOpen]);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <motion.div
          className="absolute left-[-10%] top-[4%] h-[360px] w-[360px] rounded-full bg-[#ff8a3c]/[0.11] blur-[140px]"
          animate={{ opacity: [0.44, 0.66, 0.44], scale: [1, 1.08, 1], x: [0, 18, 0], y: [0, -10, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-8%] right-[-6%] h-[420px] w-[420px] rounded-full bg-[#f59e0b]/[0.1] blur-[150px]"
          animate={{ opacity: [0.34, 0.56, 0.34], scale: [1, 0.96, 1.04, 1], x: [0, -20, 0], y: [0, 14, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 0.9 }}
        />
        <motion.div
          className="absolute left-[28%] top-[36%] h-[240px] w-[240px] rounded-full bg-[#b45309]/[0.06] blur-[120px]"
          animate={{ opacity: [0.2, 0.34, 0.2], scale: [1, 1.04, 1] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
        />
        <motion.div
          className="absolute inset-y-0 left-[-12%] w-[22%]"
          animate={{ x: ['0%', '420%'], opacity: [0, 0.55, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
          style={{
            background:
              'linear-gradient(90deg, rgba(0,0,0,0), rgba(255,179,107,0.08), rgba(0,0,0,0))',
            filter: 'blur(18px)',
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(255,138,60,0.12),transparent_24%),radial-gradient(circle_at_84%_78%,rgba(245,158,11,0.08),transparent_26%),linear-gradient(180deg,rgba(13,11,9,0.2),rgba(5,5,5,0))]" />
        <div className="absolute inset-0 shadow-[inset_0_0_180px_rgba(0,0,0,0.58)]" />
        <div className="sb-grid-bg" />
        <div className="sb-noise opacity-[0.03]" />
      </div>

      <AppSidebar activeSection={activeSection} onNavigate={() => setMobileSidebarOpen(false)} />
      <MobileSidebarDrawer
        open={mobileSidebarOpen}
        activeSection={activeSection}
        onNavigate={() => setMobileSidebarOpen(false)}
        onClose={() => setMobileSidebarOpen(false)}
      />

      <main className="min-h-screen min-w-0 md:ml-[260px]">
        <div className="w-full px-4 py-4 md:px-6 md:py-5 lg:px-8">
          <div className="relative z-[2] min-h-screen min-w-0">
            <MobileAppBar onOpenMenu={() => setMobileSidebarOpen(true)} />
            <DashboardHeader activeSection={activeSection} onConnectWallet={handleOpenWallet} />

            <div className="pb-8">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                {children}
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
