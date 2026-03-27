import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAccount, useChainId } from 'wagmi';
import { arbitrumSepolia, sepolia } from 'wagmi/chains';

import { IS_DEPLOYED, SHADOWBOOK_ADDRESS } from '../constants/config';
import BrandSignature from './BrandSignature';
import CofheBridge from './CofheBridge';
import FlowPipeline from './FlowPipeline';
import InstitutionModePanel from './InstitutionModePanel';
import OrderForm from './OrderForm';
import ShadowAI from './ShadowAI';
import ShadowInsightPanel from './ShadowInsightPanel';
import VerifiableExecutionProofPanel from './VerifiableExecutionProofPanel';
import WalletPanel from './WalletPanel';

const NAV_ITEMS = [
  { key: 'trade', title: 'Trade', icon: 'trade' },
  { key: 'proofs', title: 'Proofs', icon: 'proofs' },
  { key: 'assistant', title: 'Assistant', icon: 'assistant' },
  { key: 'settings', title: 'Settings', icon: 'settings' },
];

function createInitialFlowState() {
  return {
    plaintext: null,
    encrypted: null,
    matched: null,
    decrypted: null,
    tx: {
      hash: '',
      status: 'idle',
      chainId: null,
      explorerUrl: '',
    },
    pipeline: {
      currentStage: 'idle',
      progress: 0,
      statusMessage: 'Awaiting input',
      error: '',
      stages: {
        plaintext: { state: 'idle', label: 'Awaiting input' },
        encrypted: { state: 'idle', label: 'Awaiting input' },
        matched: { state: 'idle', label: 'Awaiting input' },
        decrypted: { state: 'idle', label: 'Awaiting input' },
      },
    },
    replay: {
      steps: [],
      canReplay: false,
      lastReplayAt: 0,
    },
  };
}

function networkLabel(chainId) {
  if (chainId === sepolia.id) return 'Sepolia';
  if (chainId === arbitrumSepolia.id) return 'Arbitrum Sepolia';
  return 'Unsupported';
}

function shorten(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

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

function AppTopLink({ href, children, external = false }) {
  const className =
    'inline-flex h-9 items-center rounded-full px-3 text-sm text-[#b8aea3] transition-colors duration-200 hover:text-white';

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function AppTopNavbar() {
  return (
    <div className="sticky top-3 z-[35] mb-5">
      <div className="relative overflow-hidden rounded-[22px] border border-[#ffcf9a]/12 bg-[linear-gradient(180deg,rgba(20,15,13,0.9),rgba(13,10,9,0.86))] px-4 py-3 shadow-[0_20px_48px_rgba(0,0,0,0.28)] backdrop-blur-[14px] md:px-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,179,107,0.06),rgba(255,255,255,0.01)_30%,transparent_62%)]" />
        <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#ffb36b]/26 to-transparent" />
        <div className="absolute left-8 top-1/2 hidden h-10 w-20 -translate-y-1/2 rounded-full bg-[#ff8a3c]/[0.06] blur-3xl lg:block" />

        <div className="relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <BrandSignature href="/" subtitle="Private execution" compact tone="warm" />
            <span className="hidden h-8 items-center rounded-full border border-white/8 bg-white/[0.025] px-3 text-[11px] font-medium tracking-[0.12em] text-[#a99684] lg:inline-flex">
              Workspace
            </span>
          </div>

          <nav className="flex flex-wrap items-center gap-1">
            <AppTopLink href="/">Home</AppTopLink>
            <AppTopLink href="https://github.com/himanshukaushik9813/ShadowBook" external>
              Docs
            </AppTopLink>
            <AppTopLink href="https://github.com/himanshukaushik9813/ShadowBook" external>
              GitHub
            </AppTopLink>
          </nav>
        </div>
      </div>
    </div>
  );
}

function AppSidebar({ activeSection, onChange }) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  return (
    <aside className="fixed inset-y-0 left-0 z-[40] hidden w-[252px] border-r border-white/10 bg-[linear-gradient(180deg,rgba(11,9,8,0.98),rgba(7,6,6,0.99))] shadow-[20px_0_60px_rgba(0,0,0,0.28)] md:flex md:flex-col">
      <div className="relative flex h-full flex-col overflow-hidden px-4 py-5">
        <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#ffb36b]/18 to-transparent" />
        <div className="absolute left-[-40px] top-16 h-28 w-28 rounded-full bg-[#ff8a3c]/[0.05] blur-[72px]" />
        <div className="absolute bottom-10 right-[-54px] h-32 w-32 rounded-full bg-[#f59e0b]/[0.04] blur-[84px]" />
        <div className="absolute right-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />

        <div className="relative z-[2] flex items-center px-2">
          <BrandSignature href="/" subtitle="Private execution" compact tone="warm" />
        </div>

        <nav className="relative z-[2] mt-8 space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const active = activeSection === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onChange(item.key)}
                className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all duration-200 ${
                  active
                    ? 'border-[#ffb36b]/16 bg-[#ff8a3c]/[0.07] text-white'
                    : 'border-transparent text-[#9f9387] hover:border-white/8 hover:bg-[#12100e] hover:text-white'
                }`}
              >
                <span className={`h-8 w-0.5 rounded-full ${active ? 'bg-[#ffb36b]' : 'bg-transparent'}`} />
                <NavIcon name={item.icon} active={active} />
                <span className="text-sm font-medium">{item.title}</span>
              </button>
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
              {isConnected ? shorten(address) : 'Awaiting session'}
            </p>
            <p className="text-xs text-[#8e877e]">
              {isConnected ? networkLabel(chainId) : 'Sepolia / Arbitrum Sepolia'}
            </p>
          </div>
          <div className="mt-4 border-t border-white/8 pt-3 text-[11px] text-[#6f6a64]">
            ShadowBook v1.0
          </div>
        </div>
      </div>
    </aside>
  );
}

function MobileNav({ activeSection, onChange }) {
  return (
    <div className="mb-6 flex w-full gap-2 overflow-x-auto pb-1 pt-1 md:hidden">
      {NAV_ITEMS.map((item) => {
        const active = activeSection === item.key;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-all duration-300 ${
              active
                ? 'border-[#ffb36b]/18 bg-[#ff8a3c]/[0.1] text-[#ffe0c2]'
                : 'border-white/10 bg-[rgba(18,14,11,0.72)] text-slate-300'
            }`}
          >
            {item.title}
          </button>
        );
      })}
    </div>
  );
}

function DashboardHeader({ activeSection, institutionMode, onConnectWallet }) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const title = NAV_ITEMS.find((item) => item.key === activeSection)?.title || 'Trade';

  return (
    <header className="mb-6">
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,rgba(20,16,14,0.94),rgba(11,9,8,0.92))] px-4 py-4 shadow-[0_22px_54px_rgba(0,0,0,0.28)] backdrop-blur-[14px] md:px-5 md:py-5">
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

        <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <Link href="/" className="group min-w-0 transition-opacity hover:opacity-95">
            <div className="inline-flex max-w-full items-center gap-4 rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
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

          <div className="rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.028),rgba(255,255,255,0.012))] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="flex flex-col gap-3 lg:items-end">
              <div className="flex flex-wrap items-center gap-2.5 lg:justify-end">
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

              <div className="flex flex-wrap items-center gap-2.5 lg:justify-end">
                {isConnected ? (
                  <button
                    type="button"
                    className="inline-flex h-10 cursor-default items-center gap-2.5 rounded-full border border-white/10 bg-[linear-gradient(180deg,rgba(17,15,13,0.88),rgba(12,10,9,0.82))] px-4 text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_14px_30px_rgba(0,0,0,0.18)]"
                    disabled
                    aria-disabled="true"
                  >
                    <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#66d17e] shadow-[0_0_10px_rgba(102,209,126,0.42)]" />
                    <span>Connected</span>
                    <span className="font-mono text-xs text-[#bcb3aa]">{shorten(address)}</span>
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

function StatusChecklist({ flowState }) {
  const stages = [
    { key: 'plaintext', label: 'Client-side encryption', helper: 'Input captured in the browser' },
    { key: 'encrypted', label: 'Payload packaging', helper: 'Encrypted payload prepared' },
    { key: 'matched', label: 'Private relay submission', helper: 'Matching and settlement processing' },
    { key: 'decrypted', label: 'Settlement finalization', helper: 'Result available to the user' },
  ];

  return (
    <div className="grid gap-3 xl:grid-cols-4">
      {stages.map((stage) => {
        const status = flowState?.pipeline?.stages?.[stage.key]?.state || 'idle';
        const completed = status === 'completed';
        const active = status === 'processing';

        return (
          <div
            key={stage.key}
            className={`rounded-2xl border px-4 py-4 ${
              completed
                ? 'border-[#ffb36b]/18 bg-[#ff8a3c]/[0.08]'
                : active
                  ? 'border-white/12 bg-white/[0.04]'
                  : 'border-white/8 bg-white/[0.025]'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full border text-[11px] ${
                  completed
                    ? 'border-[#ffb36b]/20 text-[#ffe0c2]'
                    : active
                      ? 'border-slate-500/40 text-slate-200'
                      : 'border-white/12 text-slate-500'
                }`}
              >
                {completed ? '✓' : active ? '•' : '·'}
              </span>
              <p className="text-sm font-medium text-white">{stage.label}</p>
            </div>
            <p className="mt-2 text-xs text-slate-500">{stage.helper}</p>
          </div>
        );
      })}
    </div>
  );
}

function TradeWorkspace({ flowState, onFlowUpdate, onSystemEvent, isConnected }) {
  const { address } = useAccount();
  const chainId = useChainId();

  return (
    <section className="space-y-6">
      <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,14,11,0.84),rgba(11,9,8,0.8))] p-6 shadow-[0_20px_54px_rgba(0,0,0,0.24)] backdrop-blur-xl">
        <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#ffb36b]/25 to-transparent" />
        <div className="absolute left-[-18px] top-8 h-20 w-20 rounded-full bg-[#ff8a3c]/[0.06] blur-[70px]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="sb-eyebrow">Trade</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.03em] text-white md:text-4xl">
              Private execution
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
              Encrypt locally, route privately, and settle with proof-backed finality without exposing intent.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="sb-status-pill">
              Contract{' '}
              <span className="font-mono text-slate-300">
                {IS_DEPLOYED
                  ? `${SHADOWBOOK_ADDRESS.slice(0, 6)}...${SHADOWBOOK_ADDRESS.slice(-4)}`
                  : 'Not deployed'}
              </span>
            </span>
            <span className="sb-status-pill">
              Network <span className="text-slate-300">{networkLabel(chainId)}</span>
            </span>
            <span className="sb-status-pill">
              Wallet{' '}
              <span className="font-mono text-slate-300">{address ? shorten(address) : 'Not connected'}</span>
            </span>
          </div>
        </div>
      </div>

      {isConnected ? (
        <>
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <CofheBridge>
              <OrderForm onFlowUpdate={onFlowUpdate} onSystemEvent={onSystemEvent} />
            </CofheBridge>
            <FlowPipeline flowState={flowState} />
          </div>
          <StatusChecklist flowState={flowState} />
          <ShadowInsightPanel />
        </>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <WalletPanel />
          <div className="sb-card">
            <p className="sb-eyebrow">Next</p>
            <h3 className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-white">
              Connect a wallet to begin
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              After connection, this page becomes the execution workspace. Proofs and assistant stay separate so the interface remains readable.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function ProofWorkspace({ flowState }) {
  const { address } = useAccount();
  const chainId = useChainId();

  return (
    <section className="relative space-y-8 overflow-hidden rounded-[40px] px-1 py-1">
      <motion.div
        className="pointer-events-none absolute left-[-8%] top-4 h-[320px] w-[320px] rounded-full bg-[#ff8a3c]/[0.12] blur-[120px]"
        animate={{ opacity: [0.5, 0.72, 0.5], scale: [1, 1.06, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute bottom-[-6%] right-[-6%] h-[340px] w-[340px] rounded-full bg-[#f59e0b]/[0.09] blur-[140px]"
        animate={{ opacity: [0.42, 0.62, 0.42], scale: [1, 0.97, 1.03, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
      />
      <div className="pointer-events-none absolute left-[20%] top-[34%] h-[220px] w-[220px] rounded-full bg-[#ff8a3c]/[0.05] blur-[110px]" />
      <div className="pointer-events-none absolute right-[6%] top-[18%] h-[360px] w-[120px] rounded-full bg-[linear-gradient(180deg,rgba(255,138,60,0.06),rgba(255,138,60,0))] blur-[52px]" />
      <div className="pointer-events-none absolute left-[-10%] top-[12%] hidden h-[240px] w-[520px] rounded-[999px] border border-[#ffb36b]/10 md:block" style={{ transform: 'rotate(-8deg)' }} />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(167,118,76,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(167,118,76,0.12) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(circle at center, black 22%, transparent 82%)',
        }}
      />
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_180px_rgba(0,0,0,0.5)]" />

      <motion.div
        className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,14,11,0.9),rgba(11,9,8,0.84))] p-7 shadow-[0_24px_70px_rgba(0,0,0,0.3)] backdrop-blur-xl md:p-8"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42 }}
      >
        <div className="absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-[#ffb36b]/30 to-transparent" />
        <div className="absolute left-[-20px] top-8 h-24 w-24 rounded-full bg-[#ff8a3c]/[0.08] blur-[76px]" />
        <div className="absolute right-10 top-10 h-28 w-28 rounded-full bg-[#f59e0b]/[0.06] blur-[82px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_36%)]" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="sb-eyebrow">Proofs</p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.045em] text-white md:text-5xl">
              Execution proof
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-400 md:text-base">
              Review settlement state, verification steps, and proof-backed execution records inside a dedicated ShadowBook proof workspace.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="sb-status-pill">
              Contract
              {' '}
              <span className="font-mono text-slate-300">
                {IS_DEPLOYED
                  ? `${SHADOWBOOK_ADDRESS.slice(0, 6)}...${SHADOWBOOK_ADDRESS.slice(-4)}`
                  : 'Not deployed'}
              </span>
            </span>
            <span className="sb-status-pill">
              Network
              {' '}
              <span className="text-slate-300">{networkLabel(chainId)}</span>
            </span>
            <span className="sb-status-pill">
              Wallet
              {' '}
              <span className="font-mono text-slate-300">{address ? shorten(address) : 'Not connected'}</span>
            </span>
          </div>
        </div>
      </motion.div>

      <div className="relative z-[2]">
        <VerifiableExecutionProofPanel flowState={flowState} />
      </div>
    </section>
  );
}

function AssistantWorkspace({ actionText, logs, institutionMode, flowState }) {
  return (
    <section className="space-y-6">
      <div>
        <p className="sb-eyebrow">Assistant</p>
        <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.03em] text-white">
          Helpful, secondary, and command-oriented
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
          The assistant exists to explain and unblock, not to compete with the product itself.
        </p>
      </div>
      <ShadowAI
        embedded
        actionText={actionText}
        logs={logs}
        institutionMode={institutionMode}
        flowState={flowState}
      />
    </section>
  );
}

function SettingsWorkspace({
  institutionMode,
  onInstitutionToggle,
  onRevealToAuditor,
}) {
  return (
    <section className="space-y-6">
      <div>
        <p className="sb-eyebrow">Settings</p>
        <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.03em] text-white">
          Network settings and auditor access
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
          Keep operational controls separate from trading and proof review.
        </p>
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <WalletPanel />
        <InstitutionModePanel
          enabled={institutionMode}
          onToggle={onInstitutionToggle}
          onRevealToAuditor={onRevealToAuditor}
        />
      </div>
    </section>
  );
}

function Dashboard() {
  const { isConnected } = useAccount();
  const [flowState, setFlowState] = useState(() => createInitialFlowState());
  const [institutionMode, setInstitutionMode] = useState(false);
  const [assistantAction, setAssistantAction] = useState(
    'System ready. Waiting for encrypted orderflow.'
  );
  const [activeSection, setActiveSection] = useState('trade');
  const [systemLogs, setSystemLogs] = useState([
    {
      timestamp: Date.now(),
      phase: 'info',
      message: 'Shadow AI initialized. Privacy monitor online.',
    },
  ]);

  function addSystemLog(message, phase = 'info') {
    const entry = { message, phase, timestamp: Date.now() };
    setSystemLogs((prev) => [entry, ...prev].slice(0, 40));
    setAssistantAction(message);
  }

  function handleSystemEvent(event) {
    if (!event?.message) return;
    addSystemLog(event.message, event.phase || 'info');
  }

  function handleInstitutionToggle(nextValue) {
    setInstitutionMode(nextValue);
    addSystemLog(
      nextValue
        ? 'Auditor access enabled.'
        : 'Auditor access disabled.',
      nextValue ? 'success' : 'info'
    );
  }

  function handleRevealToAuditor(proof) {
    addSystemLog(
      proof?.id
        ? `Auditor package prepared with proof ${proof.id}.`
        : 'Auditor package prepared.',
      'success'
    );
  }

  function handleOpenWallet() {
    setActiveSection('trade');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent('shadowbook:open-wallet'));
      }, 40);
    }
  }

  useEffect(() => {
    const passiveEvents = [
      'Monitoring mempool leakage surface.',
      'No public intent exposure detected.',
      'Encrypted matching engine synchronized.',
    ];
    let index = 0;

    const interval = setInterval(() => {
      index = (index + 1) % passiveEvents.length;
      setSystemLogs((prev) => [
        {
          message: passiveEvents[index],
          phase: 'info',
          timestamp: Date.now(),
        },
        ...prev,
      ].slice(0, 40));
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  const sectionContent = useMemo(() => {
    if (activeSection === 'proofs') {
      return <ProofWorkspace flowState={flowState} />;
    }

    if (activeSection === 'assistant') {
      return (
        <AssistantWorkspace
          actionText={assistantAction}
          logs={systemLogs}
          institutionMode={institutionMode}
          flowState={flowState}
        />
      );
    }

    if (activeSection === 'settings') {
      return (
        <SettingsWorkspace
          institutionMode={institutionMode}
          onInstitutionToggle={handleInstitutionToggle}
          onRevealToAuditor={handleRevealToAuditor}
        />
      );
    }

    return (
      <TradeWorkspace
        flowState={flowState}
        onFlowUpdate={setFlowState}
        onSystemEvent={handleSystemEvent}
        isConnected={isConnected}
      />
    );
  }, [
    activeSection,
    assistantAction,
    flowState,
    institutionMode,
    isConnected,
    systemLogs,
  ]);

  return (
    <main className="relative min-h-screen overflow-x-clip bg-[#050505]">
      <motion.div
        className="pointer-events-none absolute left-[-10%] top-[4%] h-[360px] w-[360px] rounded-full bg-[#ff8a3c]/[0.11] blur-[140px]"
        animate={{ opacity: [0.44, 0.66, 0.44], scale: [1, 1.08, 1], x: [0, 18, 0], y: [0, -10, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute bottom-[-8%] right-[-6%] h-[420px] w-[420px] rounded-full bg-[#f59e0b]/[0.1] blur-[150px]"
        animate={{ opacity: [0.34, 0.56, 0.34], scale: [1, 0.96, 1.04, 1], x: [0, -20, 0], y: [0, 14, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 0.9 }}
      />
      <motion.div
        className="pointer-events-none absolute left-[28%] top-[36%] h-[240px] w-[240px] rounded-full bg-[#b45309]/[0.06] blur-[120px]"
        animate={{ opacity: [0.2, 0.34, 0.2], scale: [1, 1.04, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
      />
      <motion.div
        className="pointer-events-none absolute inset-y-0 left-[-12%] w-[22%]"
        animate={{ x: ['0%', '420%'], opacity: [0, 0.55, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
        style={{
          background:
            'linear-gradient(90deg, rgba(0,0,0,0), rgba(255,179,107,0.08), rgba(0,0,0,0))',
          filter: 'blur(18px)',
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(255,138,60,0.12),transparent_24%),radial-gradient(circle_at_84%_78%,rgba(245,158,11,0.08),transparent_26%),linear-gradient(180deg,rgba(13,11,9,0.2),rgba(5,5,5,0))]" />
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_180px_rgba(0,0,0,0.58)]" />
      <div className="sb-grid-bg" />
      <div className="sb-noise opacity-[0.03]" />

      <div className="sb-app-frame flex min-h-screen w-full">
        <AppSidebar activeSection={activeSection} onChange={setActiveSection} />

        <div className="min-w-0 w-full md:pl-[252px]">
          <div className="sb-app-container relative z-[2] py-5 lg:py-7">
              <AppTopNavbar />
              <DashboardHeader
                activeSection={activeSection}
                institutionMode={institutionMode}
                onConnectWallet={handleOpenWallet}
              />
              <MobileNav activeSection={activeSection} onChange={setActiveSection} />

              <div className="pb-14">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  {sectionContent}
                </motion.div>
              </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function DappScreen() {
  return <Dashboard />;
}
