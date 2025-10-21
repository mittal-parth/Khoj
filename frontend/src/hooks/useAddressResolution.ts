import { useEffect, useState } from 'react';
import { useEnsName } from 'thirdweb/react';
import { client } from '@/lib/client';
import { BASENAME_RESOLVER_ADDRESS, resolveL2Name } from 'thirdweb/extensions/ens';
import { base } from 'thirdweb/chains';
import { formatAddress } from '@/utils/leaderboardUtils';

/**
 * Custom hook that resolves an address to its ENS name, Basename, or formatted address.
 * Returns the best available display name for the given address.
 */
export function useAddressResolution(address: string) {
  const [basename, setBasename] = useState<string | null>(null);

  // Try ENS first
  const { data: ensName } = useEnsName({
    client,
    address: address as `0x${string}`,
  });

  // Try Basename if no ENS found
  useEffect(() => {
    if (ensName) return;

    resolveL2Name({
      client,
      address: address as `0x${string}`,
      resolverAddress: BASENAME_RESOLVER_ADDRESS,
      resolverChain: base,
    })
      .then(setBasename)
      .catch(() => setBasename(null));
  }, [ensName, address]);

  return ensName || basename || formatAddress(address);
}
