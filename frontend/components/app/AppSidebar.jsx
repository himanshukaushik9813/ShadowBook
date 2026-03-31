'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAccount, useChainId } from 'wagmi';

import { networkLabel, shortenAddress } from '../../constants/network';
import BrandSignature from '../BrandSignature';

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

function SidebarContent({ onNavigate, onClose }) {
  const router = useRouter();
  const pathname = usePathname();
  const activeSection = pathname.split('/')[2] || 'trade';
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  useEffect(() => {
    NAV_ITEMS.forEach((item) => {
      router.prefetch(item.href);
    });
  }, [router]);

  function handleNavigate(event, href) {
    event.preventDefault();

    if (onNavigate) onNavigate();
    if (onClose) onClose();

    router.push(href);

    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        if (window.location.pathname !== href) {
          window.location.assign(href);
        }
      }, 600);
    }
  }

  return (
    <div className="flex h-full flex-col px-4 py-5">
      <div className="flex items-center justify-between gap-3 px-2">
        <BrandSignature href="/" subtitle="Private execution" compact tone="warm" />
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-[#d4cbc2] transition-colors duration-200 hover:border-[#ffb36b]/18 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <CloseIcon />
          </button>
        ) : null}
      </div>

      <nav className="mt-8 space-y-1.5">
        {NAV_ITEMS.map((item) => {
          const active = activeSection === item.key;
          return (
            <Link
              key={item.key}
              href={item.href}
              prefetch
              onClick={(event) => handleNavigate(event, item.href)}
              aria-current={active ? 'page' : undefined}
              className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all duration-200 ${
                active
                  ? 'border-white/10 bg-white/[0.04] text-white'
                  : 'border-transparent text-white/60 hover:border-white/10 hover:bg-white/[0.02] hover:text-white'
              }`}
            >
              <span className={`h-8 w-0.5 rounded-full ${active ? 'bg-[#ffb36b]' : 'bg-transparent'}`} />
              <NavIcon name={item.icon} active={active} />
              <span className="text-sm font-medium">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <p className="sb-eyebrow">Status</p>
        <div className="mt-3 space-y-2">
          <p className="text-sm text-white">
            {isConnected ? 'Wallet connected' : 'Wallet not connected'}
          </p>
          <p className="font-mono text-xs text-white/60">
            {isConnected ? shortenAddress(address) : 'Awaiting session'}
          </p>
          <p className="text-xs text-white/60">
            {isConnected ? networkLabel(chainId) : 'Fhenix Helium'}
          </p>
        </div>
        <div className="mt-4 border-t border-white/10 pt-3 text-[11px] text-white/40">
          ShadowBook v1.0
        </div>
      </div>
    </div>
  );
}

export function AppMobileBar({ onOpenMenu, isDesktop = false }) {
  return (
    <div className={`sticky top-3 z-[35] mb-5 lg:hidden ${isDesktop ? 'hidden' : ''}`}>
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
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

export default function AppSidebar({
  mobileOpen = false,
  onClose,
  onNavigate,
}) {
  return (
    <>
      <aside className="hidden lg:flex fixed left-0 top-0 z-40 h-screen w-[260px] flex-col border-r border-white/10 bg-[#070606] shadow-[20px_0_60px_rgba(0,0,0,0.28)]">
        <SidebarContent onNavigate={onNavigate} />
      </aside>

      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.button
              type="button"
              className="fixed inset-0 z-[44] bg-black/60 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              aria-label="Close navigation overlay"
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-[45] flex w-[86vw] max-w-[300px] flex-col border-r border-white/10 bg-[linear-gradient(180deg,rgba(11,9,8,0.99),rgba(7,6,6,1))] shadow-[24px_0_80px_rgba(0,0,0,0.38)] lg:hidden"
              initial={{ x: -24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -24, opacity: 0 }}
              transition={{ duration: 0.24 }}
            >
              <SidebarContent onNavigate={onNavigate} onClose={onClose} />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
