import { useCallback, useState } from 'react';
import { useAccount, useChainId, usePublicClient } from 'wagmi';
import { useCofheClient } from '@cofhe/react';
import { FheTypes } from '@cofhe/sdk';

import { SCALING_FACTOR } from '../constants/config';
import { useShadowBook } from './useShadowBook';

export function useDecrypt() {
  const client = useCofheClient();
  const publicClient = usePublicClient();
  const { abi, address: contractAddress } = useShadowBook();
  const { address } = useAccount();
  const chainId = useChainId();

  const [isDecrypting, setIsDecrypting] = useState(false);

  const decryptCiphertext = useCallback(
    async (ciphertext, fheType) => {
      if (!address) {
        throw new Error('Wallet not connected.');
      }

      if (!chainId) {
        throw new Error('No active chain found.');
      }

      const ctHash = typeof ciphertext === 'bigint' ? ciphertext : BigInt(ciphertext);

      setIsDecrypting(true);

      try {
        await client.permits.getOrCreateSelfPermit(chainId, address);

        return await client
          .decryptForView(ctHash, fheType)
          .setChainId(chainId)
          .setAccount(address)
          .withPermit()
          .execute();
      } finally {
        setIsDecrypting(false);
      }
    },
    [address, chainId, client]
  );

  const decryptUint32 = useCallback(
    async (ciphertext) => decryptCiphertext(ciphertext, FheTypes.Uint32),
    [decryptCiphertext]
  );

  const decryptBool = useCallback(
    async (ciphertext) => decryptCiphertext(ciphertext, FheTypes.Bool),
    [decryptCiphertext]
  );

  const decryptOrderResult = useCallback(
    async (orderId) => {
      if (!publicClient || !contractAddress) {
        return null;
      }

      const [executionPriceHandle, filledAmountHandle, didFillHandle, initialized] =
        await publicClient.readContract({
          abi,
          address: contractAddress,
          functionName: 'getOrderResult',
          args: [BigInt(orderId)],
        });

      if (!initialized) {
        return null;
      }

      const [executionPriceRaw, filledAmountRaw, didFill] = await Promise.all([
        decryptUint32(executionPriceHandle),
        decryptUint32(filledAmountHandle),
        decryptBool(didFillHandle),
      ]);

      const executionPriceNumber = Number(executionPriceRaw) / SCALING_FACTOR;
      const filledAmountNumber = Number(filledAmountRaw) / SCALING_FACTOR;

      return {
        executionPrice: executionPriceNumber,
        filledAmount: filledAmountNumber,
        didFill: Boolean(didFill),
        handles: {
          executionPrice: executionPriceHandle,
          filledAmount: filledAmountHandle,
          didFill: didFillHandle,
        },
        raw: {
          executionPrice: executionPriceRaw,
          filledAmount: filledAmountRaw,
          didFill,
        },
      };
    },
    [abi, contractAddress, decryptBool, decryptUint32, publicClient]
  );

  return {
    decryptCiphertext,
    decryptUint32,
    decryptBool,
    decryptOrderResult,
    isDecrypting,
  };
}
