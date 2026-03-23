import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

import { IS_DEPLOYED, SHADOWBOOK_ADDRESS, SHADOWBOOK_CHAIN_ID } from '../constants/config';
import ArchitectureFlow from './ArchitectureFlow';
import CofheBridge from './CofheBridge';
import CursorAura from './CursorAura';
import EncryptedOrderBook from './EncryptedOrderBook';
import ExecutionReplayMode from './ExecutionReplayMode';
import FlowPipeline from './FlowPipeline';
import InstitutionModePanel from './InstitutionModePanel';
import OrderForm from './OrderForm';
import ProofOfEncryption from './ProofOfEncryption';
import ShadowAI from './ShadowAI';
import VerifiableExecutionProofPanel from './VerifiableExecutionProofPanel';
import WalletPanel from './WalletPanel';

const HeroCinematic3D = dynamic(() => import('./HeroCinematic3D'), {
  ssr: false,
  loading: () => <section className="h-[60vh] w-full animate-pulse bg-slate-900/60" />,
});

const MevSimulator = dynamic(() => import('./MevSimulator'), {
  ssr: false,
});

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

function Dashboard() {
  const [flowState, setFlowState] = useState(() => createInitialFlowState());
  const [institutionMode, setInstitutionMode] = useState(false);
  const [assistantAction, setAssistantAction] = useState('System ready. Waiting for encrypted orderflow.');
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
        ? 'Institution mode enabled. Compliance controls active.'
        : 'Institution mode disabled. Standard private mode active.',
      nextValue ? 'success' : 'info'
    );
  }

  function handleRevealToAuditor(proof) {
    addSystemLog(
      proof?.id
        ? `Auditor package prepared with selective proof ${proof.id}.`
        : 'Auditor reveal package prepared: transaction proof + encrypted artifacts.',
      'success'
    );
  }

  useEffect(() => {
    const passiveEvents = [
      'Shadow AI: monitoring private execution queue.',
      'Shadow AI: mempool leak check passed.',
      'Shadow AI: encrypted matching engine synchronized.',
    ];
    let index = 0;

    const interval = setInterval(() => {
      index = (index + 1) % passiveEvents.length;
      setSystemLogs((prev) => {
        const entry = {
          message: passiveEvents[index],
          phase: 'info',
          timestamp: Date.now(),
        };
        return [entry, ...prev].slice(0, 40);
      });
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  function scrollToTrading() {
    const target = document.getElementById('trading-terminal');
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const tradeCompleted = flowState?.pipeline?.stages?.decrypted?.state === 'completed';

  return (
    <>
      <main className="relative overflow-x-clip pb-28">
        <div className="sb-grid-bg" />
        <div className="sb-noise" />
        <CursorAura />

        <HeroCinematic3D />

        <motion.section
          className="sb-container relative z-[2] mb-6"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-cyan-200/20 bg-slate-950/40 p-3 text-xs text-slate-300 backdrop-blur-md">
            <span className="rounded-full border border-cyan-200/20 bg-slate-900/60 px-3 py-1">
              Contract:
              {' '}
              {IS_DEPLOYED ? SHADOWBOOK_ADDRESS : 'Not deployed yet'}
            </span>
            <span className="rounded-full border border-cyan-200/20 bg-slate-900/60 px-3 py-1">
              Expected Chain:
              {' '}
              {SHADOWBOOK_CHAIN_ID}
            </span>
            {institutionMode ? (
              <span className="rounded-full border border-emerald-300/45 bg-emerald-300/10 px-3 py-1 font-semibold uppercase tracking-[0.14em] text-emerald-100">
                Institution Grade Privacy
              </span>
            ) : null}
          </div>
        </motion.section>

        <motion.section
          id="trading-terminal"
          className="sb-container relative z-[2] mb-8 grid gap-8 xl:grid-cols-[1fr_1.5fr_1fr]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.65 }}
        >
          <WalletPanel />
          <OrderForm onFlowUpdate={setFlowState} onSystemEvent={handleSystemEvent} />
          <EncryptedOrderBook flowState={flowState} />
        </motion.section>

        <motion.section
          className="sb-container relative z-[2] mb-8 grid gap-8 xl:grid-cols-[1fr_1.5fr]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.65 }}
        >
          <InstitutionModePanel
            enabled={institutionMode}
            onToggle={handleInstitutionToggle}
            onRevealToAuditor={handleRevealToAuditor}
          />
          <ArchitectureFlow />
        </motion.section>

        <motion.div
          className="sb-container relative z-[2] mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.65 }}
        >
          <ProofOfEncryption flowState={flowState} />
        </motion.div>

        <motion.div
          className="sb-container relative z-[2] mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.65 }}
        >
          <MevSimulator />
        </motion.div>

        <motion.section
          className="sb-container relative z-[2] mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.65 }}
        >
          <FlowPipeline flowState={flowState} />
        </motion.section>

        <motion.section
          className="sb-container relative z-[2] mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.65 }}
        >
          <VerifiableExecutionProofPanel flowState={flowState} />
        </motion.section>

        <motion.section
          className="sb-container relative z-[2] mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.65 }}
        >
          <ExecutionReplayMode flowState={flowState} />
        </motion.section>

        <motion.section
          id="secure-end"
          className="sb-container relative z-[2] mt-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.65 }}
        >
          <div className="sb-card relative overflow-hidden">
            <div className="sb-radial-glow -left-10 top-0 h-40 w-40 bg-emerald-300/25" />
            <div className="sb-radial-glow -right-10 bottom-0 h-40 w-40 bg-cyan-300/25" />
            <p className="sb-eyebrow relative">Secure Completion</p>
            <h3 className="sb-heading-lg relative mt-2 text-2xl md:text-4xl">
              <span className="sb-subtle-text-gradient">Trade Completed Securely</span>
            </h3>
            <p className="sb-muted relative mt-2">
              End-to-end privacy retained from order intent to execution result.
            </p>
            <div className="relative mt-5 grid gap-3 sm:grid-cols-3">
              {[
                ['Encrypted', 'Ciphertext generated client-side'],
                ['Private', 'Matching executed on encrypted state'],
                ['MEV Protected', 'Order intent hidden from bots'],
              ].map(([title, detail]) => (
                <div key={title} className="rounded-2xl border border-emerald-200/20 bg-emerald-300/10 px-4 py-3">
                  <p className="text-sm font-semibold text-emerald-50">✓ {title}</p>
                  <p className="mt-1 text-xs text-emerald-100/80">{detail}</p>
                </div>
              ))}
            </div>
            <div className="relative mt-6">
              <button type="button" className="sb-button-primary" onClick={scrollToTrading}>
                Execute Another Private Trade
              </button>
              {tradeCompleted ? (
                <p className="mt-2 text-xs text-emerald-100/90">Latest order replay is ready in Encryption Replay Mode.</p>
              ) : null}
            </div>
          </div>
        </motion.section>
      </main>

      <ShadowAI
        actionText={assistantAction}
        logs={systemLogs}
        institutionMode={institutionMode}
        flowState={flowState}
      />
    </>
  );
}

export default function DappScreen() {
  return (
    <CofheBridge>
      <Dashboard />
    </CofheBridge>
  );
}
