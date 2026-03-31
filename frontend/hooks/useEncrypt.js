import { useCallback, useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useCofheClient } from '@cofhe/react';
import { Encryptable } from '@cofhe/sdk';

import { SCALING_FACTOR } from '../constants/config';

const MAX_UINT32 = 2 ** 32 - 1;

function mapEncryptedInput(input) {
  return {
    ctHash: input.ctHash,
    securityZone: Number(input.securityZone),
    utype: Number(input.utype),
    signature: input.signature,
  };
}

function scaleToUint32(value, label) {
  const scaled = Math.round(Number(value) * SCALING_FACTOR);

  if (!Number.isFinite(scaled) || scaled <= 0) {
    throw new Error(`${label} must be greater than zero.`);
  }

  if (scaled > MAX_UINT32) {
    throw new Error(`${label} is too large for encrypted uint32 storage.`);
  }

  return scaled;
}

export function useEncrypt() {
  const client = useCofheClient();
  const { address } = useAccount();
  const chainId = useChainId();

  const [isEncrypting, setIsEncrypting] = useState(false);
  const [step, setStep] = useState('idle');

  const encryptOrderFull = useCallback(
    async (price, amount, accountOverride = address, chainOverride = chainId) => {
      if (!accountOverride) {
        throw new Error('Wallet not connected.');
      }

      if (!chainOverride) {
        throw new Error('No active chain found.');
      }

      const priceScaled = scaleToUint32(price, 'Price');
      const amountScaled = scaleToUint32(amount, 'Amount');

      setIsEncrypting(true);
      setStep('start');

      try {
        const [encryptedPrice, encryptedAmount] = await client
          .encryptInputs([
            Encryptable.uint32(BigInt(priceScaled)),
            Encryptable.uint32(BigInt(amountScaled)),
          ])
          .setAccount(accountOverride)
          .setChainId(chainOverride)
          .onStep((encryptStep) => {
            setStep(String(encryptStep));
          })
          .execute();

        setStep('done');

        return {
          encryptedPrice: mapEncryptedInput(encryptedPrice),
          encryptedAmount: mapEncryptedInput(encryptedAmount),
          priceScaled,
          amountScaled,
        };
      } finally {
        setIsEncrypting(false);
      }
    },
    [address, chainId, client]
  );

  const encryptOrder = useCallback(
    async ({ price, amount }) => {
      const result = await encryptOrderFull(price, amount);
      return {
        encryptedPrice: result.encryptedPrice,
        encryptedAmount: result.encryptedAmount,
      };
    },
    [encryptOrderFull]
  );

  return {
    encryptOrder,
    encryptOrderFull,
    isEncrypting,
    encryptionStep: step,
  };
}
