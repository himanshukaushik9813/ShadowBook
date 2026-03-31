'use client';

import { usePathname } from 'next/navigation';
import { useAccount, useChainId } from 'wagmi';

import { IS_DEPLOYED, SHADOWBOOK_ADDRESS } from '../../constants/config';
import { networkLabel, shortenAddress } from '../../constants/network';
import { useAppWorkspace } from './AppWorkspaceContext';

const CONTENT = {
  trade: {
    title: 'Trade',
    description: 'Place encrypted orders, post real escrow, and monitor settlement without turning the workspace into a dashboard maze.',
  },
  proofs: {
    title: 'Proofs',
    description: 'Review the execution record, settlement evidence, and owner-side decrypted outputs in one clear verification surface.',
  },
  assistant: {
    title: 'Assistant',
    description: 'Use Shadow AI as a calm side console for system status, proof narration, and execution guidance.',
  },
  settings: {
    title: 'Settings',
    description: 'Keep wallet, network, and disclosure controls separate from the active trading workspace.',
  },
};

function WorkspaceMark() {
  return (
    <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-[#ffcf9a]/12 bg-[linear-gradient(180deg,rgba(28,20,15,0.96),rgba(14,11,9,0.96))] shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_14px_34px_rgba(0,0,0,0.18)]">
      <span className="absolute inset-[8px] rounded-[12px] border border-white/8 bg-[radial-gradient(circle_at_30%_22%,rgba(255,179,107,0.12),transparent_56%)]" />
      <span className="relative h-2.5 w-2.5 rotate-45 rounded-[3px] bg-[#ffb36b] shadow-[0_0_10px_rgba(255,138,60,0.18)]" />
    </span>
  );
}

function MetaPill({ label, value, mono = false, active = false }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${
        active
          ? 'border-[#ffb36b]/16 bg-[#ff8a3c]/[0.08] text-[#ffe0c2]'
          : 'border-white/8 bg-white/[0.02] text-[#d4cbc2]'
      }`}
    >
      <span className="text-[#8f7f71]">{label}</span>
      <span className={mono ? 'font-mono text-[#f0e7de]' : 'text-[#f0e7de]'}>{value}</span>
    </span>
  );
}

export default function AppWorkspaceHeader() {
  const pathname = usePathname();
  const activeSection = pathname.split('/')[2] || 'trade';
  const { title, description } = CONTENT[activeSection] || CONTENT.trade;
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { institutionMode } = useAppWorkspace();

  function handleOpenWallet() {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent('shadowbook:open-wallet'));
      }, 40);
    }
  }

  return (
    <header className="sb-card-primary">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <WorkspaceMark />
            <div className="min-w-0 max-w-3xl">
              <p className="sb-eyebrow">ShadowBook</p>
              <h1 className="mt-2 text-xl font-semibold text-white md:text-2xl">
                {title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70">
                {description}
              </p>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-3 lg:items-end">
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <MetaPill
                label="Contract"
                value={
                  IS_DEPLOYED
                    ? `${SHADOWBOOK_ADDRESS.slice(0, 6)}...${SHADOWBOOK_ADDRESS.slice(-4)}`
                    : 'Not deployed'
                }
                mono
              />
              <MetaPill label="Network" value={networkLabel(chainId)} />
              {institutionMode ? <MetaPill label="Mode" value="Auditor" active /> : null}
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              {isConnected ? (
                <span className="inline-flex h-10 items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm font-medium text-white">
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#66d17e] shadow-[0_0_10px_rgba(102,209,126,0.42)]" />
                  <span>Connected</span>
                  <span className="font-mono text-xs text-[#bcb3aa]">{shortenAddress(address)}</span>
                </span>
              ) : (
                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center rounded-full border border-[#ffb36b]/16 bg-white/[0.03] px-4 text-sm font-medium text-white transition-colors duration-200 hover:border-[#ffcf9a]/24 hover:bg-[#ff8a3c]/[0.06]"
                  onClick={handleOpenWallet}
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
      </div>
    </header>
  );
}
