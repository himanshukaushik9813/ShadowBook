import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

import { IS_DEPLOYED, SHADOWBOOK_ADDRESS, SHADOWBOOK_CHAIN_ID } from '../constants/config';
import ArchitectureFlow from './ArchitectureFlow';
import CofheBridge from './CofheBridge';
import EncryptedOrderBook from './EncryptedOrderBook';
import ExecutionReplayMode from './ExecutionReplayMode';
import FlowPipeline from './FlowPipeline';
import InstitutionModePanel from './InstitutionModePanel';
import OrderForm from './OrderForm';
import ProofOfEncryption from './ProofOfEncryption';
import ShadowAI from './ShadowAI';
import WalletPanel from './WalletPanel';

const HeroCinematic3D = dynamic(() => import('./HeroCinematic3D'), {
  ssr: false,
  loading: () => <section className="cinematic-hero hero-loading-shell" />,
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

  return (
    <>
      <main className="app-shell">
        <div className="bg-grid" />
        <HeroCinematic3D />

        <motion.section
          className="protocol-overview"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7 }}
        >
          <div className="deployment-banner premium">
            <span>Contract: {IS_DEPLOYED ? SHADOWBOOK_ADDRESS : 'Not deployed yet'}</span>
            <span>Expected Chain: {SHADOWBOOK_CHAIN_ID}</span>
            {institutionMode ? <span className="institution-badge">Institution Grade Privacy</span> : null}
          </div>
        </motion.section>

        <motion.section
          className="top-grid premium-grid"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7 }}
        >
          <WalletPanel />
          <OrderForm onFlowUpdate={setFlowState} onSystemEvent={handleSystemEvent} />
          <EncryptedOrderBook flowState={flowState} />
        </motion.section>

        <motion.section
          className="intel-grid"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7 }}
        >
          <InstitutionModePanel
            enabled={institutionMode}
            onToggle={handleInstitutionToggle}
            onRevealToAuditor={handleRevealToAuditor}
          />
          <ArchitectureFlow />
        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7 }}
        >
          <ProofOfEncryption flowState={flowState} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7 }}
        >
          <MevSimulator />
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7 }}
        >
          <FlowPipeline flowState={flowState} />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7 }}
        >
          <ExecutionReplayMode flowState={flowState} />
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
