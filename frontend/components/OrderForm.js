import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAccount, useChainId, usePublicClient, useWriteContract } from 'wagmi';
import { decodeEventLog } from 'viem';

import { SUPPORTED_CHAIN_IDS } from '../constants/config';
import { useDecrypt } from '../hooks/useDecrypt';
import { useEncrypt } from '../hooks/useEncrypt';
import { useShadowBook } from '../hooks/useShadowBook';
import { addTransactionApi } from '../lib/ghostfiApi';

const TX_EXPLORER_BY_CHAIN = {
  11155111: 'https://sepolia.etherscan.io/tx/',
  421614: 'https://sepolia.arbiscan.io/tx/',
};

const EMPTY_STAGE_STATE = {
  plaintext: { state: 'idle', label: 'Awaiting input' },
  encrypted: { state: 'idle', label: 'Awaiting input' },
  matched: { state: 'idle', label: 'Awaiting input' },
  decrypted: { state: 'idle', label: 'Awaiting input' },
};

function getExplorerUrl(chainId, txHash) {
  const base = TX_EXPLORER_BY_CHAIN[Number(chainId)];
  if (!base || !txHash) return '';
  return `${base}${txHash}`;
}

function shortCipher(value) {
  if (!value) return '--';
  const text = String(value);
  if (text.length <= 20) return text;
  return `${text.slice(0, 10)}...${text.slice(-8)}`;
}

function createReplaySteps(payload) {
  return [
    {
      key: 'plaintext',
      title: 'Plaintext Order',
      description: 'Capture order intent before encryption.',
      data: payload?.plaintext || null,
    },
    {
      key: 'encrypted',
      title: 'Encryption Transform',
      description: 'Convert values into CoFHE ciphertexts on the client.',
      data: payload?.encrypted || null,
    },
    {
      key: 'submitted',
      title: 'On-chain Submission',
      description: 'Publish encrypted payload to ShadowBook contract.',
      data: payload?.submitted || null,
    },
    {
      key: 'matched',
      title: 'Private Matching',
      description: 'Run matching checks over encrypted values on-chain.',
      data: payload?.matched || null,
    },
    {
      key: 'decrypted',
      title: 'Result Decryption',
      description: 'Reveal the execution output locally with permit-based decrypt.',
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
    return 'Insufficient funds for gas. Add test ETH and retry.';
  }

  if (lowered.includes('network changed') || lowered.includes('chain')) {
    return 'Network changed during execution. Reconnect and retry on a supported chain.';
  }

  if (lowered.includes('execution reverted')) {
    return 'Contract reverted transaction. Verify inputs and contract deployment.';
  }

  return raw;
}

function getErroredStages(previousStages) {
  const stages = {
    ...EMPTY_STAGE_STATE,
    ...(previousStages || {}),
  };

  const stageOrder = ['plaintext', 'encrypted', 'matched', 'decrypted'];
  const current = stageOrder.find((key) => stages[key]?.state === 'processing');
  const fallback = current || 'matched';

  return {
    ...stages,
    [fallback]: {
      state: 'error',
      label: 'Failed',
    },
  };
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

    const timer = setInterval(() => {
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

    return () => clearInterval(timer);
  }, [active, text]);

  return <span>{display}</span>;
}

export default function OrderForm({ onFlowUpdate, onSystemEvent }) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();

  const { abi, address: contractAddress, isDeployed } = useShadowBook();
  const { encryptOrder, isEncrypting, encryptionStep } = useEncrypt();
  const { decryptUint32, decryptBool, isDecrypting } = useDecrypt();

  const { writeContractAsync, isPending: isWritingTx } = useWriteContract();

  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [orderType, setOrderType] = useState('buy');

  const [txHash, setTxHash] = useState('');
  const [txExplorerUrl, setTxExplorerUrl] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loading =
    isEncrypting ||
    isWritingTx ||
    isDecrypting ||
    ['encrypting', 'submitting', 'pending', 'matching', 'decrypting'].includes(status);

  function emitSystemEvent(message, phase = 'info') {
    if (typeof onSystemEvent === 'function') {
      onSystemEvent({
        message,
        phase,
        timestamp: Date.now(),
      });
    }
  }

  const encryptionLabel = useMemo(() => {
    if (!isEncrypting) return 'Ready';
    return `Encrypting (${encryptionStep})`;
  }, [encryptionStep, isEncrypting]);

  function updateFlowState(updater) {
    if (typeof onFlowUpdate !== 'function') return;
    onFlowUpdate(updater);
  }

  function decodeReceiptEvents(receiptLogs) {
    let orderPlaced = null;
    let orderMatched = null;

    for (const log of receiptLogs) {
      try {
        const decoded = decodeEventLog({
          abi,
          data: log.data,
          topics: log.topics,
        });

        if (decoded.eventName === 'OrderPlaced') {
          orderPlaced = decoded;
        }

        if (decoded.eventName === 'OrderMatched') {
          orderMatched = decoded;
        }
      } catch (_error) {
        // Ignore logs emitted by unrelated contracts.
      }
    }

    return {
      orderPlaced,
      orderMatched,
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setError('');
      setMessage('');
      setTxHash('');
      setTxExplorerUrl('');

      if (!isConnected || !address) {
        throw new Error('Please connect your wallet first.');
      }

      if (!SUPPORTED_CHAIN_IDS.includes(chainId)) {
        throw new Error('Switch to Sepolia or Arbitrum Sepolia to continue.');
      }

      if (!isDeployed) {
        throw new Error('Contract address is missing. Deploy the contract first.');
      }

      if (!publicClient) {
        throw new Error('Public RPC client is not ready yet. Try again in a moment.');
      }

      const parsedPrice = Number(price);
      const parsedAmount = Number(amount);

      if (!Number.isInteger(parsedPrice) || parsedPrice <= 0) {
        throw new Error('Price must be a positive integer.');
      }

      if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
        throw new Error('Amount must be a positive integer.');
      }

      if (parsedPrice > 4294967295 || parsedAmount > 4294967295) {
        throw new Error('Price and amount must fit into uint32.');
      }

      const plaintextPayload = {
        price: parsedPrice,
        amount: parsedAmount,
        orderType,
        timestamp: Date.now(),
      };

      updateFlowState((prev) => ({
        ...prev,
        plaintext: plaintextPayload,
        encrypted: null,
        matched: null,
        decrypted: null,
        tx: {
          hash: '',
          status: 'idle',
          chainId,
          explorerUrl: '',
        },
        pipeline: {
          currentStage: 'plaintext',
          progress: 12,
          statusMessage: 'Plaintext captured. Preparing encryption...',
          error: '',
          stages: {
            ...EMPTY_STAGE_STATE,
            plaintext: {
              state: 'completed',
              label: `${orderType.toUpperCase()} ${parsedAmount} @ ${parsedPrice}`,
            },
            encrypted: {
              state: 'processing',
              label: 'Processing...',
            },
            matched: {
              state: 'idle',
              label: 'Awaiting encrypted match',
            },
            decrypted: {
              state: 'idle',
              label: 'Awaiting decryption',
            },
          },
        },
        replay: {
          steps: createReplaySteps({
            plaintext: plaintextPayload,
          }),
          canReplay: false,
          lastReplayAt: prev?.replay?.lastReplayAt || 0,
        },
      }));

      setStatus('encrypting');
      setMessage('Encrypting inputs with CoFHE...');
      emitSystemEvent('Encrypting your order…', 'encrypting');

      const { encryptedPrice, encryptedAmount } = await encryptOrder({
        price: parsedPrice,
        amount: parsedAmount,
      });

      const encryptedPayload = {
        priceCtHash: encryptedPrice.ctHash.toString(),
        amountCtHash: encryptedAmount.ctHash.toString(),
        securityZone: encryptedPrice.securityZone,
        utype: encryptedPrice.utype,
      };

      updateFlowState((prev) => ({
        ...prev,
        encrypted: encryptedPayload,
        pipeline: {
          ...(prev?.pipeline || {}),
          currentStage: 'encrypted',
          progress: 38,
          statusMessage: 'Ciphertext generated. Submitting transaction...',
          error: '',
          stages: {
            ...EMPTY_STAGE_STATE,
            ...(prev?.pipeline?.stages || {}),
            encrypted: {
              state: 'completed',
              label: `Ciphertext ${shortCipher(encryptedPayload.priceCtHash)}`,
            },
            matched: {
              state: 'processing',
              label: 'Processing...',
            },
          },
        },
        replay: {
          ...(prev?.replay || {}),
          steps: createReplaySteps({
            plaintext: prev?.plaintext,
            encrypted: encryptedPayload,
          }),
          canReplay: false,
        },
      }));

      setStatus('submitting');
      setMessage('Submitting encrypted order to ShadowBook...');
      emitSystemEvent('Submitting encrypted payload to smart contract…', 'submitting');

      const hash = await writeContractAsync({
        abi,
        address: contractAddress,
        functionName: 'placeOrder',
        args: [encryptedPrice, encryptedAmount, orderType === 'buy'],
      });

      const explorerUrl = getExplorerUrl(chainId, hash);
      setTxHash(hash);
      setTxExplorerUrl(explorerUrl);
      setStatus('pending');
      setMessage('Transaction submitted. Waiting for chain confirmation...');

      updateFlowState((prev) => ({
        ...prev,
        tx: {
          hash,
          status: 'pending',
          chainId,
          explorerUrl,
        },
        pipeline: {
          ...(prev?.pipeline || {}),
          currentStage: 'matched',
          progress: 62,
          statusMessage: 'Submitted to chain. Waiting for encrypted match...',
          error: '',
          stages: {
            ...EMPTY_STAGE_STATE,
            ...(prev?.pipeline?.stages || {}),
            matched: {
              state: 'processing',
              label: 'Processing...',
            },
          },
        },
        replay: {
          ...(prev?.replay || {}),
          steps: createReplaySteps({
            plaintext: prev?.plaintext,
            encrypted: prev?.encrypted,
            submitted: {
              txHash: hash,
              chainId,
              explorerUrl,
            },
          }),
          canReplay: false,
        },
      }));

      setStatus('matching');
      setMessage('Matching over encrypted values on-chain...');
      emitSystemEvent('Matching privately…', 'matching');

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== 'success') {
        throw new Error('Transaction failed on-chain.');
      }

      emitSystemEvent('Transaction confirmed on-chain.', 'confirmed');

      const { orderPlaced, orderMatched } = decodeReceiptEvents(receipt.logs);

      const emittedOrderId = orderPlaced?.args?.orderId;
      const fallbackOrderId = await publicClient.readContract({
        abi,
        address: contractAddress,
        functionName: 'getLatestOrderIdForTrader',
        args: [address],
      });
      const orderId = emittedOrderId ?? fallbackOrderId;

      if (!orderId || BigInt(orderId) === 0n) {
        throw new Error('Could not resolve order ID from chain state.');
      }

      let encryptedExecutionPrice = orderMatched?.args?.encryptedExecutionPrice;
      let encryptedFillStatus = orderMatched?.args?.encryptedFillStatus;

      if (!encryptedExecutionPrice || !encryptedFillStatus) {
        [encryptedExecutionPrice, encryptedFillStatus] = await publicClient.readContract({
          abi,
          address: contractAddress,
          functionName: 'getOrderResult',
          args: [orderId],
        });
      }

      const matchedPayload = {
        txHash: hash,
        orderId: orderId.toString(),
        encryptedExecutionPrice,
        encryptedFillStatus,
        blockNumber: receipt.blockNumber?.toString(),
      };

      updateFlowState((prev) => ({
        ...prev,
        matched: matchedPayload,
        tx: {
          ...(prev?.tx || {}),
          hash,
          status: 'confirmed',
          chainId,
          explorerUrl: explorerUrl || prev?.tx?.explorerUrl || '',
        },
        pipeline: {
          ...(prev?.pipeline || {}),
          currentStage: 'decrypted',
          progress: 82,
          statusMessage: 'Encrypted match complete. Decrypting execution result...',
          error: '',
          stages: {
            ...EMPTY_STAGE_STATE,
            ...(prev?.pipeline?.stages || {}),
            matched: {
              state: 'completed',
              label: `Order #${orderId.toString()} matched`,
            },
            decrypted: {
              state: 'processing',
              label: 'Processing...',
            },
          },
        },
        replay: {
          ...(prev?.replay || {}),
          steps: createReplaySteps({
            plaintext: prev?.plaintext,
            encrypted: prev?.encrypted,
            submitted: {
              txHash: hash,
              chainId,
              explorerUrl: explorerUrl || prev?.tx?.explorerUrl || '',
            },
            matched: matchedPayload,
          }),
          canReplay: false,
        },
      }));

      setStatus('decrypting');
      setMessage('Creating permit and decrypting execution result...');
      emitSystemEvent('Decrypting result with secure permit…', 'decrypting');

      const [executionPrice, fillStatus] = await Promise.all([
        decryptUint32(encryptedExecutionPrice),
        decryptBool(encryptedFillStatus),
      ]);

      const normalizedExecutionPrice =
        typeof executionPrice === 'bigint' ? executionPrice.toString() : String(executionPrice);
      const normalizedFillStatus =
        typeof fillStatus === 'boolean'
          ? fillStatus
          : String(fillStatus).toLowerCase() === 'true' || String(fillStatus) === '1';

      const decryptedPayload = {
        executionPrice: normalizedExecutionPrice,
        filled: normalizedFillStatus,
        decryptedAt: Date.now(),
      };

      updateFlowState((prev) => ({
        ...prev,
        decrypted: decryptedPayload,
        pipeline: {
          ...(prev?.pipeline || {}),
          currentStage: 'decrypted',
          progress: 100,
          statusMessage: normalizedFillStatus
            ? 'Execution complete. Order matched privately and decrypted locally.'
            : 'Execution complete. No counter-order fill yet; decrypted status returned.',
          error: '',
          stages: {
            ...EMPTY_STAGE_STATE,
            ...(prev?.pipeline?.stages || {}),
            decrypted: {
              state: 'completed',
              label: normalizedFillStatus ? 'Filled' : 'No Fill',
            },
          },
        },
        replay: {
          ...(prev?.replay || {}),
          steps: createReplaySteps({
            plaintext: prev?.plaintext,
            encrypted: prev?.encrypted,
            submitted: {
              txHash: hash,
              chainId,
              explorerUrl: explorerUrl || prev?.tx?.explorerUrl || '',
            },
            matched: prev?.matched,
            decrypted: decryptedPayload,
          }),
          canReplay: true,
          lastReplayAt: Date.now(),
        },
      }));

      setStatus('success');
      setMessage('Order processed and decrypted successfully.');
      emitSystemEvent('Order cycle complete. Privacy preserved end-to-end.', 'success');

      // Keep privacy-finance state fresh for GhostFi scoring and eligibility engines.
      const notional = parsedPrice * parsedAmount;
      const transactionKind = orderType === 'sell' ? 'income' : 'expense';

      addTransactionApi({
        userId: address,
        kind: transactionKind,
        amount: notional,
        source: 'encrypted-order',
        metadata: {
          orderType,
          txHash: hash,
          chainId,
        },
      })
        .then((apiResult) => {
          const score = apiResult?.user?.creditScore;
          if (score) {
            emitSystemEvent(`Credit score updated privately. Current score: ${score}.`, 'info');
          }
        })
        .catch((apiError) => {
          emitSystemEvent(`Credit engine update skipped: ${apiError.message}`, 'error');
        });
    } catch (submitError) {
      const errorMessage = normalizeSubmitError(submitError);
      setStatus('error');
      setMessage('');
      setError(errorMessage);
      updateFlowState((prev) => ({
        ...prev,
        tx: {
          ...(prev?.tx || {}),
          status: 'failed',
        },
        pipeline: {
          ...(prev?.pipeline || {}),
          currentStage: 'error',
          error: errorMessage,
          statusMessage: 'Execution failed. Review the error and retry.',
          stages: getErroredStages(prev?.pipeline?.stages),
        },
      }));
      emitSystemEvent(`Execution error: ${errorMessage}`, 'error');
    }
  }

  return (
    <div className="sb-card h-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="sb-eyebrow">Execution Terminal</p>
          <h3 className="sb-heading-lg mt-2 text-2xl">Place Encrypted Order</h3>
          <p className="sb-muted mt-2">Client-side encryption → on-chain private matching.</p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
            loading
              ? 'border-cyan-300/45 bg-cyan-400/10 text-cyan-100'
              : 'border-slate-500/40 bg-slate-800/45 text-slate-300'
          }`}
        >
          <ScrambleText active={loading} text={encryptionLabel} />
        </span>
      </div>

      <form className="mt-5 grid gap-3" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm" title="This step encrypts your order price on client">
          <span className="text-slate-200">Price (uint32)</span>
          <input
            className="sb-input"
            type="number"
            min="1"
            max="4294967295"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="e.g. 1250"
            required
          />
        </label>

        <label className="grid gap-2 text-sm" title="This step encrypts your order amount on client">
          <span className="text-slate-200">Amount (uint32)</span>
          <input
            className="sb-input"
            type="number"
            min="1"
            max="4294967295"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="e.g. 10"
            required
          />
        </label>

        <label className="grid gap-2 text-sm" title="Buy or sell side for encrypted intent">
          <span className="text-slate-200">Side</span>
          <select
            className="sb-input"
            value={orderType}
            onChange={(event) => setOrderType(event.target.value)}
          >
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
        </label>

        <button type="submit" className="sb-button-primary mt-1 w-full" disabled={loading || !isConnected}>
          {loading ? 'Processing...' : 'Encrypt & Submit Order'}
        </button>
      </form>

      {message ? (
        <motion.p
          className="mt-4 rounded-xl border border-cyan-200/30 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-100"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {message}
        </motion.p>
      ) : null}

      {txHash ? (
        <p className="mt-3 break-all font-mono text-xs text-slate-300">
          tx:{' '}
          {txExplorerUrl ? (
            <a className="text-cyan-200 underline-offset-2 hover:underline" href={txExplorerUrl} target="_blank" rel="noreferrer">
              {txHash}
            </a>
          ) : (
            <span>{txHash}</span>
          )}
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-xl border border-rose-300/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      ) : null}
    </div>
  );
}
