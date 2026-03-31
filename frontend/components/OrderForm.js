import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAccount, useChainId, usePublicClient, useWriteContract } from 'wagmi';
import { decodeEventLog, formatUnits } from 'viem';

import {
  SCALING_FACTOR,
  SHADOWBOOK_CHAIN_ID,
  SHADOW_ETH_ADDRESS,
  SHADOW_USDC_ADDRESS,
} from '../constants/config';
import { erc20Abi } from '../constants/erc20Abi';
import { getExplorerTxUrl, networkLabel, shortenAddress } from '../constants/network';
import { useDecrypt } from '../hooks/useDecrypt';
import { useEncrypt } from '../hooks/useEncrypt';
import { useShadowBook } from '../hooks/useShadowBook';
import { useTokens } from '../hooks/useTokens';
import { addTransactionApi } from '../lib/ghostfiApi';

const MAX_UINT32 = 2 ** 32 - 1;
const BASE_TOKEN_DECIMALS_FACTOR = 10n ** 12n;
const QUOTE_TOKEN_DECIMALS_FACTOR = 10n ** 6n;

const EMPTY_STAGE_STATE = {
  plaintext: { state: 'idle', label: 'Awaiting order input' },
  encrypted: { state: 'idle', label: 'Awaiting encryption' },
  submitted: { state: 'idle', label: 'Awaiting submission' },
  matching: { state: 'idle', label: 'Awaiting counterparty' },
  decrypted: { state: 'idle', label: 'Awaiting owner decrypt' },
};

function scalePreview(value, label) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }

  const numeric = Number(value);
  const scaled = Math.round(numeric * SCALING_FACTOR);

  if (!Number.isFinite(scaled) || scaled <= 0) {
    throw new Error(`${label} must be greater than zero.`);
  }

  if (scaled > MAX_UINT32) {
    throw new Error(`${label} exceeds encrypted uint32 capacity.`);
  }

  return scaled;
}

function formatDisplayNumber(value, maximumFractionDigits = 4) {
  if (!Number.isFinite(Number(value))) return '--';
  return Number(value).toLocaleString(undefined, { maximumFractionDigits });
}

function formatTokenAmount(rawValue, symbol, maximumFractionDigits = 4) {
  return `${formatDisplayNumber(Number(formatUnits(rawValue || 0n, 18)), maximumFractionDigits)} ${symbol}`;
}

function shortCipher(value) {
  if (!value) return '--';
  const text = String(value);
  if (text.length <= 20) return text;
  return `${text.slice(0, 10)}...${text.slice(-8)}`;
}

function ReadinessRow({ label, detail, state = 'pending' }) {
  const tone =
    state === 'ready'
      ? 'border-[#ffb36b]/16 bg-[#ff8a3c]/[0.06] text-[#ffe0c2]'
      : state === 'blocked'
        ? 'border-rose-200/20 bg-rose-200/[0.05] text-rose-100'
        : 'border-white/10 bg-white/[0.02] text-white/70';

  const dotTone =
    state === 'ready'
      ? 'bg-[#66d17e]'
      : state === 'blocked'
        ? 'bg-rose-300'
        : 'bg-white/40';

  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${tone}`}>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-[0.14em] text-white/50">{label}</p>
        <p className="mt-1 text-sm">{detail}</p>
      </div>
      <span className={`inline-flex h-2.5 w-2.5 shrink-0 rounded-full ${dotTone}`} />
    </div>
  );
}

function createReplaySteps(payload) {
  return [
    {
      key: 'plaintext',
      title: 'Plaintext Order',
      description: 'Order inputs captured before encryption.',
      data: payload?.plaintext || null,
    },
    {
      key: 'encrypted',
      title: 'Encryption Transform',
      description: 'CoFHE ciphertexts generated in the browser.',
      data: payload?.encrypted || null,
    },
    {
      key: 'submitted',
      title: 'Escrowed Submission',
      description: 'Encrypted order and real escrow posted on-chain.',
      data: payload?.submitted || null,
    },
    {
      key: 'matching',
      title: 'Private Matching',
      description: 'Order searched privately against encrypted liquidity.',
      data: payload?.matched || payload?.order || null,
    },
    {
      key: 'decrypted',
      title: 'Owner Reveal',
      description: 'Execution result decrypted only for the order owner.',
      data: payload?.decrypted || null,
    },
  ];
}

function normalizeSubmitError(error) {
  const raw = error?.shortMessage || error?.message || 'Unknown error';
  const lowered = String(raw).toLowerCase();

  if (lowered.includes('user rejected') || lowered.includes('rejected the request')) {
    return 'Transaction rejected from wallet.';
  }

  if (lowered.includes('insufficient funds') || lowered.includes('gas required exceeds')) {
    return 'Insufficient funds for gas. Add test tFHE and retry.';
  }

  if (lowered.includes('chain') || lowered.includes('network')) {
    return 'Switch to Fhenix Helium and retry.';
  }

  if (lowered.includes('execution reverted')) {
    return 'Transaction reverted. Verify token balances, approval, and deployment addresses.';
  }

  return raw;
}

function ScrambleText({ active, text }) {
  const [display, setDisplay] = useState(text);
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890#@$%*';

  useEffect(() => {
    if (!active) {
      setDisplay(text);
      return undefined;
    }

    let frame = 0;

    const timer = window.setInterval(() => {
      const scrambled = text
        .split('')
        .map((character, index) => {
          if (character === ' ') return ' ';
          if (index < frame / 2) return character;
          return charset[Math.floor(Math.random() * charset.length)];
        })
        .join('');

      setDisplay(scrambled);
      frame += 1;

      if (frame > text.length * 2) {
        frame = 0;
      }
    }, 40);

    return () => window.clearInterval(timer);
  }, [active, text]);

  return <span>{display}</span>;
}

function getTransferTokenLabel(address) {
  const normalized = String(address || '').toLowerCase();
  if (normalized === String(SHADOW_USDC_ADDRESS || '').toLowerCase()) return 'ShadowUSDC';
  if (normalized === String(SHADOW_ETH_ADDRESS || '').toLowerCase()) return 'ShadowETH';
  return 'Token';
}

function decodeShadowBookLogs(receiptLogs, abi) {
  let placed = null;

  for (const log of receiptLogs) {
    try {
      const decoded = decodeEventLog({
        abi,
        data: log.data,
        topics: log.topics,
      });

      if (decoded.eventName === 'OrderPlaced') {
        placed = decoded;
      }
    } catch (_error) {
      // Ignore unrelated logs.
    }
  }

  return { placed };
}

function parseSettlementTransfers(logs) {
  const transfers = [];

  for (const log of logs) {
    const tokenAddress = String(log.address || '').toLowerCase();
    if (
      tokenAddress !== String(SHADOW_USDC_ADDRESS || '').toLowerCase() &&
      tokenAddress !== String(SHADOW_ETH_ADDRESS || '').toLowerCase()
    ) {
      continue;
    }

    try {
      const decoded = decodeEventLog({
        abi: erc20Abi,
        data: log.data,
        topics: log.topics,
      });

      if (decoded.eventName !== 'Transfer') {
        continue;
      }

      const tokenLabel = getTransferTokenLabel(log.address);
      transfers.push({
        token: tokenLabel,
        tokenAddress: log.address,
        from: decoded.args.from,
        to: decoded.args.to,
        value: decoded.args.value,
        amountFormatted: formatTokenAmount(
          decoded.args.value,
          tokenLabel === 'ShadowUSDC' ? 'sUSDC' : 'sETH'
        ),
      });
    } catch (_error) {
      // Ignore logs that are not ERC-20 transfer events.
    }
  }

  return transfers;
}

export default function OrderForm({ onFlowUpdate, onSystemEvent }) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { abi, address: contractAddress, isDeployed } = useShadowBook();
  const { encryptOrderFull, isEncrypting, encryptionStep } = useEncrypt();
  const { decryptOrderResult, isDecrypting } = useDecrypt();
  const {
    usdcBalance,
    ethBalance,
    usdcAllowance,
    ethAllowance,
    approveUSDC,
    approveETH,
    refetch: refetchTokens,
  } = useTokens();
  const { writeContractAsync, isPending: isWritingTx } = useWriteContract();

  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [orderType, setOrderType] = useState('buy');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activeOrder, setActiveOrder] = useState(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isRetryingSettlement, setIsRetryingSettlement] = useState(false);

  const loading =
    isEncrypting ||
    isWritingTx ||
    isDecrypting ||
    isApproving ||
    isRetryingSettlement ||
    ['encrypting', 'submitting', 'pending', 'matching', 'decrypting', 'cancelling'].includes(status);

  const isBuy = orderType === 'buy';
  const correctChain = Number(chainId) === Number(SHADOWBOOK_CHAIN_ID);

  const derivedOrder = useMemo(() => {
    const parsedPrice = price === '' ? null : Number(price);
    const parsedAmount = amount === '' ? null : Number(amount);

    if (parsedPrice === null || parsedAmount === null) {
      return {
        parsedPrice,
        parsedAmount,
        priceScaled: null,
        amountScaled: null,
        totalValue: null,
        escrowAmount: 0n,
        balance: isBuy ? usdcBalance : ethBalance,
        allowance: isBuy ? usdcAllowance : ethAllowance,
        error: '',
      };
    }

    try {
      const priceScaled = scalePreview(parsedPrice, 'Price');
      const amountScaled = scalePreview(parsedAmount, 'Amount');
      const totalValue = parsedPrice * parsedAmount;
      const escrowAmount = isBuy
        ? BigInt(priceScaled) * BigInt(amountScaled) * QUOTE_TOKEN_DECIMALS_FACTOR
        : BigInt(amountScaled) * BASE_TOKEN_DECIMALS_FACTOR;

      return {
        parsedPrice,
        parsedAmount,
        priceScaled,
        amountScaled,
        totalValue,
        escrowAmount,
        balance: isBuy ? usdcBalance : ethBalance,
        allowance: isBuy ? usdcAllowance : ethAllowance,
        error: '',
      };
    } catch (previewError) {
      return {
        parsedPrice,
        parsedAmount,
        priceScaled: null,
        amountScaled: null,
        totalValue: null,
        escrowAmount: 0n,
        balance: isBuy ? usdcBalance : ethBalance,
        allowance: isBuy ? usdcAllowance : ethAllowance,
        error: previewError.message,
      };
    }
  }, [amount, ethAllowance, ethBalance, isBuy, price, usdcAllowance, usdcBalance]);

  const needsApproval =
    isConnected &&
    derivedOrder.escrowAmount > 0n &&
    derivedOrder.allowance < derivedOrder.escrowAmount;

  const insufficientBalance =
    isConnected &&
    derivedOrder.escrowAmount > 0n &&
    derivedOrder.balance < derivedOrder.escrowAmount;

  const hasLiveOrder = Boolean(activeOrder && ['matching', 'open', 'pending'].includes(status));

  const submitDisabled =
    loading ||
    hasLiveOrder ||
    !isConnected ||
    !correctChain ||
    !isDeployed ||
    Boolean(derivedOrder.error) ||
    !derivedOrder.parsedPrice ||
    !derivedOrder.parsedAmount ||
    insufficientBalance ||
    needsApproval;

  const readinessItems = useMemo(
    () => [
      {
        label: 'Wallet session',
        detail: isConnected ? `Connected as ${shortenAddress(address)}` : 'Connect wallet to begin',
        state: isConnected ? 'ready' : 'blocked',
      },
      {
        label: 'Network',
        detail: correctChain ? 'Fhenix Helium ready' : `Switch from ${networkLabel(chainId)} to Fhenix Helium`,
        state: correctChain ? 'ready' : 'blocked',
      },
      {
        label: 'Escrow balance',
        detail:
          derivedOrder.escrowAmount > 0n
            ? insufficientBalance
              ? `Need ${formatTokenAmount(derivedOrder.escrowAmount, isBuy ? 'sUSDC' : 'sETH')}`
              : `Sufficient ${isBuy ? 'ShadowUSDC' : 'ShadowETH'} for escrow`
            : 'Enter price and amount to compute escrow',
        state:
          derivedOrder.escrowAmount === 0n
            ? 'pending'
            : insufficientBalance
              ? 'blocked'
              : 'ready',
      },
      {
        label: 'Allowance',
        detail:
          derivedOrder.escrowAmount > 0n
            ? needsApproval
              ? `Approve ${isBuy ? 'ShadowUSDC' : 'ShadowETH'} before submission`
              : 'Allowance already covers this order'
            : 'Approval check activates after escrow is computed',
        state:
          derivedOrder.escrowAmount === 0n
            ? 'pending'
            : needsApproval
              ? 'blocked'
              : 'ready',
      },
    ],
    [
      address,
      chainId,
      correctChain,
      derivedOrder.escrowAmount,
      insufficientBalance,
      isBuy,
      isConnected,
      needsApproval,
    ]
  );

  const blockingNotice = useMemo(() => {
    if (derivedOrder.error) return derivedOrder.error;
    if (!isConnected) return 'Connect a wallet to start a private trading session.';
    if (!correctChain) {
      return `Connected to ${networkLabel(chainId)}. Switch to Fhenix Helium to submit encrypted orders.`;
    }
    if (insufficientBalance) {
      return `Insufficient ${isBuy ? 'ShadowUSDC' : 'ShadowETH'} balance for the required escrow.`;
    }
    if (hasLiveOrder) {
      return `Order #${activeOrder.orderId} is still being monitored. Match it, retry settlement, or cancel it before opening another order.`;
    }
    return '';
  }, [
    activeOrder,
    chainId,
    correctChain,
    derivedOrder.error,
    hasLiveOrder,
    insufficientBalance,
    isBuy,
    isConnected,
  ]);

  const primaryActionLabel = useMemo(() => {
    if (needsApproval) {
      return `Approve ${isBuy ? 'ShadowUSDC' : 'ShadowETH'} first`;
    }
    if (hasLiveOrder) {
      return `Monitoring order #${activeOrder?.orderId}`;
    }
    if (status === 'matched') {
      return 'Order matched';
    }
    if (status === 'cancelled') {
      return 'Order cancelled';
    }
    if (loading) {
      return 'Processing...';
    }
    return 'Submit encrypted order';
  }, [activeOrder?.orderId, hasLiveOrder, isBuy, loading, needsApproval, status]);

  function emitSystemEvent(messageText, phase = 'info') {
    if (typeof onSystemEvent === 'function') {
      onSystemEvent({
        message: messageText,
        phase,
        timestamp: Date.now(),
      });
    }
  }

  function updateFlowState(updater) {
    if (typeof onFlowUpdate === 'function') {
      onFlowUpdate(updater);
    }
  }

  const encryptionLabel = useMemo(() => {
    if (!isEncrypting) return hasLiveOrder ? 'Live order' : 'Ready';
    return `Encrypting (${encryptionStep})`;
  }, [encryptionStep, hasLiveOrder, isEncrypting]);

  const resetFlowState = useCallback(
    (statusMessage = 'Awaiting input') => {
      updateFlowState((prev) => ({
        ...prev,
        plaintext: null,
        encrypted: null,
        submitted: null,
        matched: null,
        decrypted: null,
        order: null,
        tx: {
          hash: '',
          status: 'idle',
          chainId: chainId || SHADOWBOOK_CHAIN_ID,
          explorerUrl: '',
          blockNumber: null,
        },
        pipeline: {
          currentStage: 'plaintext',
          progress: 0,
          statusMessage,
          error: '',
          stages: { ...EMPTY_STAGE_STATE },
        },
        replay: {
          steps: [],
          canReplay: false,
          lastReplayAt: prev?.replay?.lastReplayAt || 0,
        },
      }));
    },
    [chainId]
  );

  const findMatchEvidence = useCallback(
    async (orderId, fromBlock = 0n) => {
      if (!publicClient || !contractAddress) return null;

      const logs = await publicClient.getLogs({
        address: contractAddress,
        fromBlock,
        toBlock: 'latest',
      });

      let latestMatch = null;

      for (const log of logs) {
        try {
          const decoded = decodeEventLog({
            abi,
            data: log.data,
            topics: log.topics,
          });

          if (
            decoded.eventName === 'OrderMatched' &&
            (Number(decoded.args.orderId) === Number(orderId) ||
              Number(decoded.args.counterOrderId) === Number(orderId))
          ) {
            latestMatch = {
              ...decoded,
              blockNumber: log.blockNumber,
              transactionHash: log.transactionHash,
            };
          }
        } catch (_error) {
          // Ignore unrelated logs.
        }
      }

      if (!latestMatch?.transactionHash) {
        return null;
      }

      const [receipt, block] = await Promise.all([
        publicClient.getTransactionReceipt({ hash: latestMatch.transactionHash }),
        publicClient.getBlock({ blockNumber: latestMatch.blockNumber }),
      ]);

      return {
        matchTxHash: latestMatch.transactionHash,
        blockNumber: latestMatch.blockNumber,
        timestamp: Number(block.timestamp) * 1000,
        counterOrderId: Number(latestMatch.args.counterOrderId),
        eventExecutionPrice: Number(latestMatch.args.executionPrice) / SCALING_FACTOR,
        eventFilledAmount: Number(latestMatch.args.filledAmount) / SCALING_FACTOR,
        settlementTransfers: parseSettlementTransfers(receipt.logs),
      };
    },
    [abi, contractAddress, publicClient]
  );

  const finalizeMatchedOrder = useCallback(
    async (orderId, submissionContext) => {
      if (!publicClient || !contractAddress) {
        return;
      }

      setStatus('decrypting');
      setMessage('Decrypting private execution result...');
      emitSystemEvent(`Decrypting order #${orderId} result…`, 'decrypting');

      updateFlowState((prev) => ({
        ...prev,
        pipeline: {
          ...(prev?.pipeline || {}),
          currentStage: 'decrypted',
          progress: 88,
          statusMessage: 'Counterparty found. Preparing owner-side decrypt...',
          error: '',
          stages: {
            ...EMPTY_STAGE_STATE,
            ...(prev?.pipeline?.stages || {}),
            matching: {
              state: 'completed',
              label: 'Private fill confirmed',
            },
            decrypted: {
              state: 'processing',
              label: 'Decrypting...',
            },
          },
        },
      }));

      const [executionPriceHandle, filledAmountHandle, didFillHandle] = await publicClient.readContract({
        abi,
        address: contractAddress,
        functionName: 'getOrderResult',
        args: [BigInt(orderId)],
      });

      const [view, decrypted, matchEvidence] = await Promise.all([
        publicClient.readContract({
          abi,
          address: contractAddress,
          functionName: 'getOrderView',
          args: [BigInt(orderId)],
        }),
        decryptOrderResult(orderId),
        findMatchEvidence(orderId, submissionContext?.blockNumber || 0n),
      ]);

      const matchedPayload = {
        orderId: Number(orderId),
        matchTxHash: matchEvidence?.matchTxHash || submissionContext?.txHash || '',
        matchExplorerUrl: getExplorerTxUrl(matchEvidence?.matchTxHash || submissionContext?.txHash || ''),
        blockNumber: matchEvidence?.blockNumber ? Number(matchEvidence.blockNumber) : null,
        timestamp: matchEvidence?.timestamp || Date.now(),
        counterOrderId: matchEvidence?.counterOrderId || null,
        executionPriceHandle,
        filledAmountHandle,
        didFillHandle,
        settlementTransfers: matchEvidence?.settlementTransfers || [],
        executionPriceFromEvent: matchEvidence?.eventExecutionPrice ?? null,
        filledAmountFromEvent: matchEvidence?.eventFilledAmount ?? null,
        escrowRemaining: view.escrowRemaining,
      };

      const decryptedPayload = {
        executionPrice: decrypted?.executionPrice ?? 0,
        filledAmount: decrypted?.filledAmount ?? 0,
        didFill: Boolean(decrypted?.didFill),
        decryptedAt: Date.now(),
      };

      updateFlowState((prev) => ({
        ...prev,
        matched: matchedPayload,
        decrypted: decryptedPayload,
        order: {
          ...(prev?.order || {}),
          orderId: Number(orderId),
          status: 'matched',
          lastMatchTimestamp: matchedPayload.timestamp,
          lastExecutionPrice: decryptedPayload.executionPrice,
        },
        pipeline: {
          ...(prev?.pipeline || {}),
          currentStage: 'decrypted',
          progress: 100,
          statusMessage: `Matched ${formatDisplayNumber(decryptedPayload.filledAmount, 6)} ETH at ${formatDisplayNumber(
            decryptedPayload.executionPrice,
            4
          )} USDC.`,
          error: '',
          stages: {
            ...EMPTY_STAGE_STATE,
            ...(prev?.pipeline?.stages || {}),
            submitted: {
              state: 'completed',
              label: `Order #${orderId}`,
            },
            matching: {
              state: 'completed',
              label: 'Settlement confirmed',
            },
            decrypted: {
              state: 'completed',
              label: 'Owner result revealed',
            },
          },
        },
        replay: {
          ...(prev?.replay || {}),
          steps: createReplaySteps({
            plaintext: prev?.plaintext,
            encrypted: prev?.encrypted,
            submitted: prev?.submitted,
            matched: matchedPayload,
            order: prev?.order,
            decrypted: decryptedPayload,
          }),
          canReplay: true,
          lastReplayAt: Date.now(),
        },
      }));

      setStatus('matched');
      setMessage(
        `Match confirmed: ${formatDisplayNumber(decryptedPayload.filledAmount, 6)} ETH filled at ${formatDisplayNumber(
          decryptedPayload.executionPrice,
          4
        )} USDC.`
      );
      emitSystemEvent(`Order #${orderId} settled privately with proof-backed finality.`, 'success');
      setActiveOrder(null);
      await refetchTokens();
    },
    [abi, contractAddress, decryptOrderResult, findMatchEvidence, publicClient, refetchTokens]
  );

  useEffect(() => {
    if (!activeOrder?.orderId || !publicClient || !contractAddress || !address) {
      return undefined;
    }

    let cancelled = false;

    const pollOrder = async () => {
      try {
        const view = await publicClient.readContract({
          abi,
          address: contractAddress,
          functionName: 'getOrderView',
          args: [BigInt(activeOrder.orderId)],
        });

        if (cancelled) return;

        if (view.cancelled) {
          setStatus('cancelled');
          setMessage('Order cancelled. Residual escrow returned to your wallet.');
          emitSystemEvent(`Order #${activeOrder.orderId} was cancelled.`, 'info');
          setActiveOrder(null);
          await refetchTokens();
          return;
        }

        if (view.didFill || view.fullyFilled) {
          await finalizeMatchedOrder(activeOrder.orderId, activeOrder);
          return;
        }

        const elapsed = Date.now() - activeOrder.startedAt;
        if (elapsed >= 30_000 && !activeOrder.markedOpen) {
          if (cancelled) return;
          setStatus('open');
          setMessage('Order is live in the book. Polling for counterparties...');
          emitSystemEvent(`Order #${activeOrder.orderId} is live in the encrypted book.`, 'info');
          setActiveOrder((prev) => (prev ? { ...prev, markedOpen: true } : prev));
          updateFlowState((prev) => ({
            ...prev,
            order: {
              ...(prev?.order || {}),
              status: 'open',
            },
            pipeline: {
              ...(prev?.pipeline || {}),
              currentStage: 'matching',
              progress: 74,
              statusMessage: 'Order is live in the book. Continuing private match polling...',
              error: '',
              stages: {
                ...EMPTY_STAGE_STATE,
                ...(prev?.pipeline?.stages || {}),
                matching: {
                  state: 'completed',
                  label: 'Live in book',
                },
              },
            },
          }));
        }
      } catch (pollError) {
        if (!cancelled) {
          const errorMessage = normalizeSubmitError(pollError);
          setError(errorMessage);
          emitSystemEvent(`Order polling failed: ${errorMessage}`, 'error');
        }
      }
    };

    pollOrder();
    const interval = window.setInterval(pollOrder, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [
    abi,
    activeOrder,
    address,
    contractAddress,
    finalizeMatchedOrder,
    publicClient,
    refetchTokens,
  ]);

  async function handleApproval() {
    if (!correctChain) {
      setError('Switch to Fhenix Helium before approving.');
      return;
    }

    setIsApproving(true);
    setError('');
    setMessage(`Approving ${isBuy ? 'ShadowUSDC' : 'ShadowETH'} for ShadowBook escrow...`);

    try {
      const hash = isBuy ? await approveUSDC() : await approveETH();
      setMessage(`${isBuy ? 'ShadowUSDC' : 'ShadowETH'} approval confirmed.`);
      emitSystemEvent(`Approval confirmed: ${shortCipher(hash)}.`, 'success');
    } catch (approvalError) {
      const approvalMessage = normalizeSubmitError(approvalError);
      setError(approvalMessage);
      emitSystemEvent(`Approval failed: ${approvalMessage}`, 'error');
    } finally {
      setIsApproving(false);
    }
  }

  async function handleCancelOrder() {
    if (!activeOrder?.orderId || !publicClient) return;

    setStatus('cancelling');
    setError('');

    try {
      const escrowRemaining = await publicClient.readContract({
        abi,
        address: contractAddress,
        functionName: 'orderEscrow',
        args: [BigInt(activeOrder.orderId)],
      });

      const hash = await writeContractAsync({
        abi,
        address: contractAddress,
        functionName: 'cancelOrder',
        args: [BigInt(activeOrder.orderId)],
      });

      await publicClient.waitForTransactionReceipt({ hash });
      await refetchTokens();

      const refundLabel = formatTokenAmount(
        escrowRemaining,
        activeOrder.isBuy ? 'sUSDC' : 'sETH'
      );

      setStatus('cancelled');
      setMessage(`Escrow refunded: ${refundLabel} returned.`);
      emitSystemEvent(`Order #${activeOrder.orderId} cancelled. Escrow returned.`, 'success');
      setActiveOrder(null);
      setPrice('');
      setAmount('');
      resetFlowState('Order cancelled. Ready for a new encrypted order.');
    } catch (cancelError) {
      const cancelMessage = normalizeSubmitError(cancelError);
      setStatus('open');
      setError(cancelMessage);
      emitSystemEvent(`Cancellation failed: ${cancelMessage}`, 'error');
    }
  }

  async function handleRetrySettlement() {
    if (!activeOrder?.orderId || !publicClient) return;

    setIsRetryingSettlement(true);
    setError('');
    setStatus('matching');
    setMessage(`Triggering a manual private settlement scan for order #${activeOrder.orderId}...`);
    emitSystemEvent(`Manual settlement scan requested for order #${activeOrder.orderId}.`, 'matching');

    try {
      const hash = await writeContractAsync({
        abi,
        address: contractAddress,
        functionName: 'settleDirect',
        args: [BigInt(activeOrder.orderId)],
      });

      const explorerUrl = getExplorerTxUrl(hash);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      updateFlowState((prev) => ({
        ...prev,
        tx: {
          hash,
          status: 'confirmed',
          chainId,
          explorerUrl,
          blockNumber: Number(receipt.blockNumber),
        },
        pipeline: {
          ...(prev?.pipeline || {}),
          currentStage: 'matching',
          progress: Math.max(Number(prev?.pipeline?.progress || 0), 78),
          statusMessage: `Manual scan submitted for order #${activeOrder.orderId}. Re-checking encrypted liquidity...`,
          error: '',
          stages: {
            ...EMPTY_STAGE_STATE,
            ...(prev?.pipeline?.stages || {}),
            matching: {
              state: 'processing',
              label: 'Re-scanning book...',
            },
          },
        },
      }));

      const view = await publicClient.readContract({
        abi,
        address: contractAddress,
        functionName: 'getOrderView',
        args: [BigInt(activeOrder.orderId)],
      });

      setActiveOrder((prev) =>
        prev
          ? {
              ...prev,
              txHash: hash,
              explorerUrl,
              blockNumber: receipt.blockNumber,
              startedAt: Date.now(),
              markedOpen: !view.didFill && !view.fullyFilled,
            }
          : prev
      );

      if (view.didFill || view.fullyFilled) {
        await finalizeMatchedOrder(activeOrder.orderId, {
          ...activeOrder,
          txHash: hash,
          explorerUrl,
          blockNumber: receipt.blockNumber,
        });
        return;
      }

      setStatus('open');
      setMessage('Manual scan completed. The order remains live in the encrypted book.');
      emitSystemEvent(`Order #${activeOrder.orderId} remains open after the manual scan.`, 'info');
    } catch (retryError) {
      const retryMessage = normalizeSubmitError(retryError);
      setError(retryMessage);
      setMessage('');
      setStatus('open');
      emitSystemEvent(`Manual settlement scan failed: ${retryMessage}`, 'error');
    } finally {
      setIsRetryingSettlement(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitDisabled) {
      if (needsApproval) {
        await handleApproval();
      }
      return;
    }

    try {
      setError('');
      setMessage('');

      const plaintextPayload = {
        price: derivedOrder.parsedPrice,
        amount: derivedOrder.parsedAmount,
        totalValue: derivedOrder.totalValue,
        orderType,
        escrowAmount: derivedOrder.escrowAmount.toString(),
        escrowDisplay: formatTokenAmount(derivedOrder.escrowAmount, isBuy ? 'sUSDC' : 'sETH'),
        escrowToken: isBuy ? 'ShadowUSDC' : 'ShadowETH',
        priceScaled: derivedOrder.priceScaled,
        amountScaled: derivedOrder.amountScaled,
        chainId,
        timestamp: Date.now(),
      };

      updateFlowState((prev) => ({
        ...prev,
        plaintext: plaintextPayload,
        encrypted: null,
        submitted: null,
        matched: null,
        decrypted: null,
        order: null,
        tx: {
          hash: '',
          status: 'idle',
          chainId,
          explorerUrl: '',
          blockNumber: null,
        },
        pipeline: {
          currentStage: 'plaintext',
          progress: 10,
          statusMessage: 'Plaintext order captured. Preparing CoFHE encryption...',
          error: '',
          stages: {
            ...EMPTY_STAGE_STATE,
            plaintext: {
              state: 'completed',
              label: `${orderType.toUpperCase()} ${formatDisplayNumber(derivedOrder.parsedAmount, 6)} ETH`,
            },
            encrypted: {
              state: 'processing',
              label: 'Encrypting...',
            },
          },
        },
        replay: {
          steps: createReplaySteps({ plaintext: plaintextPayload }),
          canReplay: false,
          lastReplayAt: prev?.replay?.lastReplayAt || 0,
        },
      }));

      setStatus('encrypting');
      setMessage('Encrypting order inputs with CoFHE...');
      emitSystemEvent('Encrypting order intent locally…', 'encrypting');

      const {
        encryptedPrice,
        encryptedAmount,
        priceScaled,
        amountScaled,
      } = await encryptOrderFull(derivedOrder.parsedPrice, derivedOrder.parsedAmount, address, chainId);

      const encryptedPayload = {
        priceCtHash: encryptedPrice.ctHash.toString(),
        amountCtHash: encryptedAmount.ctHash.toString(),
        securityZone: encryptedPrice.securityZone,
        utype: encryptedPrice.utype,
        priceScaled,
        amountScaled,
      };

      updateFlowState((prev) => ({
        ...prev,
        encrypted: encryptedPayload,
        pipeline: {
          ...(prev?.pipeline || {}),
          currentStage: 'encrypted',
          progress: 32,
          statusMessage: 'Ciphertexts prepared. Posting real token escrow on-chain...',
          error: '',
          stages: {
            ...EMPTY_STAGE_STATE,
            ...(prev?.pipeline?.stages || {}),
            encrypted: {
              state: 'completed',
              label: `Price ${shortCipher(encryptedPayload.priceCtHash)}`,
            },
            submitted: {
              state: 'processing',
              label: 'Escrowing and submitting...',
            },
          },
        },
        replay: {
          ...(prev?.replay || {}),
          steps: createReplaySteps({
            plaintext: prev?.plaintext,
            encrypted: encryptedPayload,
          }),
        },
      }));

      setStatus('submitting');
      setMessage(`Escrowing ${formatTokenAmount(derivedOrder.escrowAmount, isBuy ? 'sUSDC' : 'sETH')} and submitting order...`);
      emitSystemEvent('Sending encrypted order with real escrow to ShadowBook…', 'submitting');

      const txHash = await writeContractAsync({
        abi,
        address: contractAddress,
        functionName: 'placeOrder',
        args: [encryptedPrice, encryptedAmount, isBuy, derivedOrder.escrowAmount],
      });

      const explorerUrl = getExplorerTxUrl(txHash);

      updateFlowState((prev) => ({
        ...prev,
        tx: {
          hash: txHash,
          status: 'pending',
          chainId,
          explorerUrl,
          blockNumber: null,
        },
        submitted: {
          txHash,
          explorerUrl,
          escrowAmount: derivedOrder.escrowAmount.toString(),
          escrowToken: isBuy ? 'ShadowUSDC' : 'ShadowETH',
        },
        pipeline: {
          ...(prev?.pipeline || {}),
          currentStage: 'submitted',
          progress: 52,
          statusMessage: 'Transaction broadcast. Waiting for order receipt...',
          error: '',
          stages: {
            ...EMPTY_STAGE_STATE,
            ...(prev?.pipeline?.stages || {}),
            submitted: {
              state: 'processing',
              label: 'Waiting for receipt...',
            },
          },
        },
      }));

      setStatus('pending');
      setMessage('Transaction submitted. Waiting for Fhenix Helium confirmation...');

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== 'success') {
        throw new Error('Transaction failed on-chain.');
      }

      const { placed } = decodeShadowBookLogs(receipt.logs, abi);
      const fallbackOrderId = await publicClient.readContract({
        abi,
        address: contractAddress,
        functionName: 'getLatestOrderIdForTrader',
        args: [address],
      });

      const orderId = Number(placed?.args?.orderId ?? fallbackOrderId);
      if (!orderId) {
        throw new Error('Could not resolve the placed order ID.');
      }

      const submittedPayload = {
        txHash,
        explorerUrl,
        orderId,
        blockNumber: Number(receipt.blockNumber),
        escrowAmount: derivedOrder.escrowAmount.toString(),
        escrowToken: isBuy ? 'ShadowUSDC' : 'ShadowETH',
      };

      updateFlowState((prev) => ({
        ...prev,
        submitted: submittedPayload,
        order: {
          orderId,
          status: 'matching',
          isBuy,
          escrowToken: isBuy ? 'ShadowUSDC' : 'ShadowETH',
          escrowAmount: derivedOrder.escrowAmount.toString(),
          placedAt: Number(placed?.args?.timestamp || Math.floor(Date.now() / 1000)),
        },
        tx: {
          hash: txHash,
          status: 'confirmed',
          chainId,
          explorerUrl,
          blockNumber: Number(receipt.blockNumber),
        },
        pipeline: {
          ...(prev?.pipeline || {}),
          currentStage: 'matching',
          progress: 66,
          statusMessage: `Order #${orderId} confirmed. Searching for a private counterparty...`,
          error: '',
          stages: {
            ...EMPTY_STAGE_STATE,
            ...(prev?.pipeline?.stages || {}),
            submitted: {
              state: 'completed',
              label: `Order #${orderId}`,
            },
            matching: {
              state: 'processing',
              label: 'Searching privately...',
            },
          },
        },
        replay: {
          ...(prev?.replay || {}),
          steps: createReplaySteps({
            plaintext: prev?.plaintext,
            encrypted: prev?.encrypted,
            submitted: submittedPayload,
            order: {
              orderId,
              status: 'matching',
            },
          }),
        },
      }));

      setStatus('matching');
      setMessage('Searching for counterparty...');
      emitSystemEvent(`Order #${orderId} confirmed. Private match polling started.`, 'matching');

      setActiveOrder({
        orderId,
        txHash,
        explorerUrl,
        blockNumber: receipt.blockNumber,
        startedAt: Date.now(),
        isBuy,
        escrowDisplay: formatTokenAmount(derivedOrder.escrowAmount, isBuy ? 'sUSDC' : 'sETH'),
        markedOpen: false,
      });

      const notional = Number(derivedOrder.totalValue || 0);
      const transactionKind = isBuy ? 'expense' : 'income';
      addTransactionApi({
        userId: address,
        kind: transactionKind,
        amount: notional,
        source: 'encrypted-order',
        metadata: {
          orderType,
          txHash,
          chainId,
          orderId,
        },
      }).catch((apiError) => {
        emitSystemEvent(`Credit engine update skipped: ${apiError.message}`, 'error');
      });
    } catch (submitError) {
      const errorMessage = normalizeSubmitError(submitError);
      setStatus('error');
      setMessage('');
      setError(errorMessage);
      setActiveOrder(null);
      updateFlowState((prev) => ({
        ...prev,
        tx: {
          ...(prev?.tx || {}),
          status: 'failed',
        },
        pipeline: {
          ...(prev?.pipeline || {}),
          currentStage: 'matching',
          progress: prev?.pipeline?.progress || 0,
          statusMessage: 'Order flow failed. Review the error and retry.',
          error: errorMessage,
          stages: {
            ...EMPTY_STAGE_STATE,
            ...(prev?.pipeline?.stages || {}),
            matching: {
              state: 'error',
              label: 'Execution failed',
            },
          },
        },
      }));
      emitSystemEvent(`Execution error: ${errorMessage}`, 'error');
    }
  }

  return (
    <div className="sb-card-primary space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="sb-eyebrow">Execution Terminal</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Place encrypted order</h3>
          <p className="sb-muted mt-2">Real token escrow, encrypted price and amount, private on-chain matching.</p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
            loading
              ? 'border-[#ffb36b]/18 bg-[#ff8a3c]/[0.08] text-[#ffe0c2]'
              : 'border-white/10 bg-white/[0.03] text-white/70'
          }`}
        >
          <ScrambleText active={loading} text={encryptionLabel} />
        </span>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm">
            <span className="text-white/70">Price (USDC per ETH)</span>
            <input
              className="sb-input"
              type="number"
              step="0.000001"
              min="0.000001"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="e.g. 1800"
              disabled={hasLiveOrder}
              required
            />
          </label>

          <label className="grid gap-2 text-sm">
            <span className="text-white/70">Amount (ETH)</span>
            <input
              className="sb-input"
              type="number"
              step="0.000001"
              min="0.000001"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="e.g. 1.25"
              disabled={hasLiveOrder}
              required
            />
          </label>
        </div>

        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'buy', label: 'Buy ShadowETH with ShadowUSDC' },
              { key: 'sell', label: 'Sell ShadowETH for ShadowUSDC' },
            ].map((option) => {
              const active = orderType === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    active
                      ? 'border-[#ffb36b]/20 bg-[#ff8a3c]/[0.08] text-[#ffe0c2]'
                      : 'border-white/10 bg-white/[0.03] text-white/70 hover:border-white/16 hover:text-white'
                  }`}
                  onClick={() => setOrderType(option.key)}
                  disabled={hasLiveOrder}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/50">Total value</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {derivedOrder.totalValue !== null
                  ? `${formatDisplayNumber(derivedOrder.totalValue, 4)} USDC`
                  : '--'}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/50">Escrow notice</p>
              <p className="mt-2 text-sm text-white/70">
                {derivedOrder.escrowAmount > 0n
                  ? `This order will escrow ${formatTokenAmount(
                      derivedOrder.escrowAmount,
                      isBuy ? 'sUSDC' : 'sETH'
                    )}.`
                  : 'Enter price and amount to compute escrow.'}
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-[11px] uppercase tracking-[0.12em] text-white/50">Wallet balance</p>
              <p className="mt-1 text-sm text-white">
                {formatTokenAmount(derivedOrder.balance, isBuy ? 'sUSDC' : 'sETH')}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-[11px] uppercase tracking-[0.12em] text-white/50">Current allowance</p>
              <p className="mt-1 text-sm text-white">
                {formatTokenAmount(derivedOrder.allowance, isBuy ? 'sUSDC' : 'sETH')}
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {readinessItems.map((item) => (
              <ReadinessRow
                key={item.label}
                label={item.label}
                detail={item.detail}
                state={item.state}
              />
            ))}
          </div>
        </div>

        {blockingNotice ? (
          <p
            className={`rounded-xl px-4 py-3 text-sm ${
              derivedOrder.error || insufficientBalance
                ? 'border border-rose-200/20 bg-rose-200/[0.05] text-rose-100'
                : 'border border-white/10 bg-white/[0.03] text-white/70'
            }`}
          >
            {blockingNotice}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          {needsApproval ? (
            <button
              type="button"
              className="sb-button-primary"
              onClick={handleApproval}
              disabled={loading || !correctChain || insufficientBalance}
            >
              {isApproving ? 'Approving...' : primaryActionLabel}
            </button>
          ) : (
            <button type="submit" className="sb-button-primary" disabled={submitDisabled}>
              {primaryActionLabel}
            </button>
          )}

          {(status === 'open' || status === 'matching') && activeOrder ? (
            <button
              type="button"
              className="sb-button-ghost"
              onClick={handleRetrySettlement}
              disabled={loading}
            >
              {isRetryingSettlement ? 'Re-scanning...' : 'Retry settlement scan'}
            </button>
          ) : null}

          {(status === 'open' || status === 'matching') && activeOrder ? (
            <button
              type="button"
              className="sb-button-ghost"
              onClick={handleCancelOrder}
              disabled={loading}
            >
              {status === 'cancelling' ? 'Cancelling...' : 'Cancel order'}
            </button>
          ) : null}
        </div>
      </form>

      {(message || error || activeOrder) ? (
        <div className="space-y-3">
          {message ? (
            <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70">
              {message}
            </p>
          ) : null}

          {error ? (
            <p className="rounded-2xl border border-rose-200/20 bg-rose-200/[0.05] px-4 py-3 text-sm text-rose-100">
              {error}
            </p>
          ) : null}

          {activeOrder ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-white/50">Live order</p>
                <p className="mt-2 text-sm text-white">#{activeOrder.orderId}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-white/50">Active tx</p>
                <p className="mt-2 font-mono text-xs text-white">{shortCipher(activeOrder.txHash)}</p>
                {activeOrder.explorerUrl ? (
                  <a
                    href={activeOrder.explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex text-xs text-[#ffe0c2] underline-offset-2 hover:underline"
                  >
                    View explorer
                  </a>
                ) : null}
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-white/50">Escrow posted</p>
                <p className="mt-2 text-sm text-white">
                  {activeOrder.escrowDisplay || '--'}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
