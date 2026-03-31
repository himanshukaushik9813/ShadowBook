import { useMemo, useState } from 'react';
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';
import { formatUnits, maxUint256 } from 'viem';

import { SHADOW_ETH_ADDRESS, SHADOW_USDC_ADDRESS } from '../constants/config';
import { erc20Abi } from '../constants/erc20Abi';
import { useTokens } from '../hooks/useTokens';

const MINT_USDC_AMOUNT = 10_000n * 10n ** 18n;
const MINT_ETH_AMOUNT = 10n * 10n ** 18n;

function formatTokenAmount(value, decimals = 18, maximumFractionDigits = 4) {
  return Number(formatUnits(value || 0n, decimals)).toLocaleString(undefined, {
    maximumFractionDigits,
  });
}

export default function FaucetPanel() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const {
    usdcBalance,
    ethBalance,
    usdcAllowance,
    ethAllowance,
    approveUSDC,
    approveETH,
    refetch,
  } = useTokens();

  const [statusMessage, setStatusMessage] = useState('');
  const [isMintingUSDC, setIsMintingUSDC] = useState(false);
  const [isMintingETH, setIsMintingETH] = useState(false);
  const [isApprovingUSDC, setIsApprovingUSDC] = useState(false);
  const [isApprovingETH, setIsApprovingETH] = useState(false);

  const balanceRows = useMemo(
    () => [
      {
        label: 'ShadowUSDC',
        value: `${formatTokenAmount(usdcBalance)} sUSDC`,
        allowance: `${formatTokenAmount(usdcAllowance)} approved`,
      },
      {
        label: 'ShadowETH',
        value: `${formatTokenAmount(ethBalance)} sETH`,
        allowance: `${formatTokenAmount(ethAllowance)} approved`,
      },
    ],
    [ethAllowance, ethBalance, usdcAllowance, usdcBalance]
  );

  async function mintToken(tokenAddress, amount, label, setLoading) {
    if (!address || !tokenAddress) {
      setStatusMessage('Connect a wallet before minting faucet tokens.');
      return;
    }

    setLoading(true);
    setStatusMessage(`Minting ${label}...`);

    try {
      const hash = await writeContractAsync({
        abi: erc20Abi,
        address: tokenAddress,
        functionName: 'mint',
        args: [address, amount],
      });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      await refetch();
      setStatusMessage(`${label} minted successfully.`);
    } catch (error) {
      setStatusMessage(error?.shortMessage || error?.message || `Minting ${label} failed.`);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(label, setLoading, approveFn) {
    setLoading(true);
    setStatusMessage(`Approving ${label}...`);

    try {
      await approveFn(maxUint256);
      setStatusMessage(`${label} approval updated.`);
    } catch (error) {
      setStatusMessage(error?.shortMessage || error?.message || `Approving ${label} failed.`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="sb-card-secondary h-full space-y-4">
      <div className="space-y-2">
        <p className="sb-eyebrow">Faucet</p>
        <h3 className="text-xl font-semibold text-white">
          Testnet balances
        </h3>
        <p className="sb-muted">Mint demo assets and approve ShadowBook for escrowed settlement.</p>
      </div>

      <div className="space-y-3">
        {balanceRows.map((row) => (
          <div
            key={row.label}
            className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-white">{row.label}</p>
              <p className="text-sm text-[#ffe0c2]">{row.value}</p>
            </div>
            <p className="mt-2 text-xs text-slate-500">{row.allowance}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-2">
        <button
          type="button"
          className="sb-button-primary w-full"
          disabled={!isConnected || isMintingUSDC}
          onClick={() =>
            mintToken(SHADOW_USDC_ADDRESS, MINT_USDC_AMOUNT, '10,000 ShadowUSDC', setIsMintingUSDC)
          }
        >
          {isMintingUSDC ? 'Minting...' : 'Mint 10,000 USDC'}
        </button>
        <button
          type="button"
          className="sb-button-primary w-full"
          disabled={!isConnected || isMintingETH}
          onClick={() => mintToken(SHADOW_ETH_ADDRESS, MINT_ETH_AMOUNT, '10 ShadowETH', setIsMintingETH)}
        >
          {isMintingETH ? 'Minting...' : 'Mint 10 ETH'}
        </button>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <div>
          <p className="text-sm font-medium text-white">Approve ShadowBook</p>
          <p className="mt-1 text-xs text-white/50">Set token approvals to MaxUint256.</p>
        </div>

        <div className="mt-4 grid gap-2">
          <button
            type="button"
            className="sb-button-ghost w-full"
            disabled={!isConnected || isApprovingUSDC}
            onClick={() => handleApprove('ShadowUSDC', setIsApprovingUSDC, approveUSDC)}
          >
            {isApprovingUSDC ? 'Approving USDC...' : 'Approve USDC'}
          </button>
          <button
            type="button"
            className="sb-button-ghost w-full"
            disabled={!isConnected || isApprovingETH}
            onClick={() => handleApprove('ShadowETH', setIsApprovingETH, approveETH)}
          >
            {isApprovingETH ? 'Approving ETH...' : 'Approve ETH'}
          </button>
        </div>
      </div>

      {statusMessage ? (
        <p className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white/70">
          {statusMessage}
        </p>
      ) : null}
    </section>
  );
}
