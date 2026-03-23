import { useCallback, useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useCofheClient } from '@cofhe/react';
import { Encryptable } from '@cofhe/sdk';

function mapEncryptedInput(input) {
  return {
    ctHash: input.ctHash,
    securityZone: Number(input.securityZone),
    utype: Number(input.utype),
    signature: input.signature,
  };
}

export function useEncrypt() {
  const client = useCofheClient();
  const { address } = useAccount();
  const chainId = useChainId();

  const [isEncrypting, setIsEncrypting] = useState(false);
  const [step, setStep] = useState('idle');

  const encryptOrder = useCallback(
    async ({ price, amount }) => {
      if (!address) {
        throw new Error('Wallet not connected.');
      }

      if (!chainId) {
        throw new Error('No active chain found.');
      }

      setIsEncrypting(true);
      setStep('start');

      try {
        const [encryptedPrice, encryptedAmount] = await client
          .encryptInputs([
            Encryptable.uint32(BigInt(price)),
            Encryptable.uint32(BigInt(amount)),
          ])
          .setAccount(address)
          .setChainId(chainId)
          .onStep((encryptStep) => {
            setStep(String(encryptStep));
          })
          .execute();

        setStep('done');

        return {
          encryptedPrice: mapEncryptedInput(encryptedPrice),
          encryptedAmount: mapEncryptedInput(encryptedAmount),
        };
      } finally {
        setIsEncrypting(false);
      }
    },
    [address, chainId, client]
  );

  return {
    encryptOrder,
    isEncrypting,
    encryptionStep: step,
  };
}
