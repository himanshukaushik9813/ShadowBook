'use client';

import FaucetPanel from '../FaucetPanel';
import FlowPipeline from '../FlowPipeline';
import InstitutionModePanel from '../InstitutionModePanel';
import OrderBookPanel from '../OrderBookPanel';
import OrderForm from '../OrderForm';
import ShadowAI from '../ShadowAI';
import TradeHistoryPanel from '../TradeHistoryPanel';
import VerifiableExecutionProofPanel from '../VerifiableExecutionProofPanel';
import WalletPanel from '../WalletPanel';
import { useAppWorkspace } from './AppWorkspaceContext';

function SupportStack({ children }) {
  return <div className="space-y-6">{children}</div>;
}

export function TradeWorkspace() {
  const { flowState, setFlowState, handleSystemEvent } = useAppWorkspace();

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)] xl:items-start">
        <div className="min-w-0 space-y-6">
          <OrderForm onFlowUpdate={setFlowState} onSystemEvent={handleSystemEvent} />
          <FlowPipeline flowState={flowState} />
        </div>

        <div className="min-w-0">
          <SupportStack>
            <OrderBookPanel />
            <TradeHistoryPanel />
            <WalletPanel />
            <FaucetPanel />
          </SupportStack>
        </div>
      </div>
    </section>
  );
}

export function ProofsWorkspace() {
  const { flowState } = useAppWorkspace();

  return (
    <section className="space-y-6">
      <VerifiableExecutionProofPanel flowState={flowState} />
    </section>
  );
}

export function AssistantWorkspace() {
  const { assistantAction, systemLogs, institutionMode, flowState } = useAppWorkspace();

  return (
    <section className="space-y-6">
      <ShadowAI
        embedded
        actionText={assistantAction}
        logs={systemLogs}
        institutionMode={institutionMode}
        flowState={flowState}
      />
    </section>
  );
}

export function SettingsWorkspace() {
  const { institutionMode, handleInstitutionToggle, handleRevealToAuditor } = useAppWorkspace();

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="min-w-0">
          <WalletPanel />
        </div>
        <div className="min-w-0">
          <InstitutionModePanel
            enabled={institutionMode}
            onToggle={handleInstitutionToggle}
            onRevealToAuditor={handleRevealToAuditor}
          />
        </div>
      </div>
    </section>
  );
}
