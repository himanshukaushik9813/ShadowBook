'use client';

import { createContext, useContext, useEffect, useState } from 'react';

function createInitialFlowState() {
  return {
    plaintext: null,
    encrypted: null,
    submitted: null,
    order: null,
    matched: null,
    decrypted: null,
    tx: {
      hash: '',
      status: 'idle',
      chainId: null,
      explorerUrl: '',
      blockNumber: null,
    },
    pipeline: {
      currentStage: 'plaintext',
      progress: 0,
      statusMessage: 'Awaiting input',
      error: '',
      stages: {
        plaintext: { state: 'idle', label: 'Awaiting input' },
        encrypted: { state: 'idle', label: 'Awaiting input' },
        submitted: { state: 'idle', label: 'Awaiting input' },
        matching: { state: 'idle', label: 'Awaiting input' },
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

const AppWorkspaceContext = createContext(null);

export function AppWorkspaceProvider({ children }) {
  const [flowState, setFlowState] = useState(() => createInitialFlowState());
  const [institutionMode, setInstitutionMode] = useState(false);
  const [assistantAction, setAssistantAction] = useState(
    'System ready. Waiting for encrypted orderflow.'
  );
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
      nextValue ? 'Auditor access enabled.' : 'Auditor access disabled.',
      nextValue ? 'success' : 'info'
    );
  }

  function handleRevealToAuditor(proof) {
    addSystemLog(
      proof?.id ? `Auditor package prepared with proof ${proof.id}.` : 'Auditor package prepared.',
      'success'
    );
  }

  useEffect(() => {
    const passiveEvents = [
      'Monitoring mempool leakage surface.',
      'No public intent exposure detected.',
      'Encrypted matching engine synchronized.',
    ];
    let index = 0;

    const interval = window.setInterval(() => {
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

    return () => window.clearInterval(interval);
  }, []);

  return (
    <AppWorkspaceContext.Provider
      value={{
        flowState,
        setFlowState,
        institutionMode,
        assistantAction,
        systemLogs,
        handleSystemEvent,
        handleInstitutionToggle,
        handleRevealToAuditor,
      }}
    >
      {children}
    </AppWorkspaceContext.Provider>
  );
}

export function useAppWorkspace() {
  const context = useContext(AppWorkspaceContext);

  if (!context) {
    throw new Error('useAppWorkspace must be used inside AppWorkspaceProvider.');
  }

  return context;
}
