import { useCallback, useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useCofheClient } from '@cofhe/react';
import { FheTypes } from '@cofhe/sdk';

export function useDecrypt() {
  const client = useCofheClient();
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

  return {
    decryptCiphertext,
    decryptUint32,
    decryptBool,
    isDecrypting,
  };
}
