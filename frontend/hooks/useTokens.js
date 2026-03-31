import { useCallback } from 'react';
import { useAccount, usePublicClient, useReadContract, useWriteContract } from 'wagmi';
import { maxUint256 } from 'viem';

import {
  IS_DEPLOYED,
  SHADOWBOOK_ADDRESS,
  SHADOW_ETH_ADDRESS,
  SHADOW_USDC_ADDRESS,
} from '../constants/config';
import { erc20Abi } from '../constants/erc20Abi';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export function useTokens() {
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const hasAccount = Boolean(address);
  const canReadUSDC = Boolean(hasAccount && SHADOW_USDC_ADDRESS);
  const canReadETH = Boolean(hasAccount && SHADOW_ETH_ADDRESS);
  const canReadAllowances = Boolean(hasAccount && IS_DEPLOYED && SHADOWBOOK_ADDRESS);
  const owner = address || ZERO_ADDRESS;

  const usdcBalanceQuery = useReadContract({
    abi: erc20Abi,
    address: SHADOW_USDC_ADDRESS,
    functionName: 'balanceOf',
    args: [owner],
    query: {
      enabled: canReadUSDC,
      refetchInterval: 15000,
    },
  });

  const ethBalanceQuery = useReadContract({
    abi: erc20Abi,
    address: SHADOW_ETH_ADDRESS,
    functionName: 'balanceOf',
    args: [owner],
    query: {
      enabled: canReadETH,
      refetchInterval: 15000,
    },
  });

  const usdcAllowanceQuery = useReadContract({
    abi: erc20Abi,
    address: SHADOW_USDC_ADDRESS,
    functionName: 'allowance',
    args: [owner, SHADOWBOOK_ADDRESS || ZERO_ADDRESS],
    query: {
      enabled: canReadAllowances && Boolean(SHADOW_USDC_ADDRESS),
      refetchInterval: 15000,
    },
  });

  const ethAllowanceQuery = useReadContract({
    abi: erc20Abi,
    address: SHADOW_ETH_ADDRESS,
    functionName: 'allowance',
    args: [owner, SHADOWBOOK_ADDRESS || ZERO_ADDRESS],
    query: {
      enabled: canReadAllowances && Boolean(SHADOW_ETH_ADDRESS),
      refetchInterval: 15000,
    },
  });

  const refetch = useCallback(async () => {
    await Promise.allSettled([
      usdcBalanceQuery.refetch(),
      ethBalanceQuery.refetch(),
      usdcAllowanceQuery.refetch(),
      ethAllowanceQuery.refetch(),
    ]);
  }, [
    ethAllowanceQuery,
    ethBalanceQuery,
    usdcAllowanceQuery,
    usdcBalanceQuery,
  ]);

  const approveUSDC = useCallback(
    async (amount = maxUint256) => {
      if (!address || !SHADOW_USDC_ADDRESS || !SHADOWBOOK_ADDRESS) {
        throw new Error('Wallet or token configuration missing.');
      }

      const hash = await writeContractAsync({
        abi: erc20Abi,
        address: SHADOW_USDC_ADDRESS,
        functionName: 'approve',
        args: [SHADOWBOOK_ADDRESS, BigInt(amount)],
      });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }
      await refetch();
      return hash;
    },
    [address, publicClient, refetch, writeContractAsync]
  );

  const approveETH = useCallback(
    async (amount = maxUint256) => {
      if (!address || !SHADOW_ETH_ADDRESS || !SHADOWBOOK_ADDRESS) {
        throw new Error('Wallet or token configuration missing.');
      }

      const hash = await writeContractAsync({
        abi: erc20Abi,
        address: SHADOW_ETH_ADDRESS,
        functionName: 'approve',
        args: [SHADOWBOOK_ADDRESS, BigInt(amount)],
      });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }
      await refetch();
      return hash;
    },
    [address, publicClient, refetch, writeContractAsync]
  );

  return {
    usdcBalance: usdcBalanceQuery.data || 0n,
    ethBalance: ethBalanceQuery.data || 0n,
    usdcAllowance: usdcAllowanceQuery.data || 0n,
    ethAllowance: ethAllowanceQuery.data || 0n,
    approveUSDC,
    approveETH,
    refetch,
  };
}
