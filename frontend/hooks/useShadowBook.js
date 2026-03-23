import { shadowBookAbi } from '../constants/shadowBookAbi';
import { IS_DEPLOYED, SHADOWBOOK_ADDRESS } from '../constants/config';

export function useShadowBook() {
  return {
    abi: shadowBookAbi,
    address: SHADOWBOOK_ADDRESS,
    isDeployed: Boolean(IS_DEPLOYED),
  };
}
