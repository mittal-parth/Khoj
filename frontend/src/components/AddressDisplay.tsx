import { useEffect, useState } from 'react';
import { useEnsName } from 'thirdweb/react';
import { client } from '@/lib/client';
import { BASENAME_RESOLVER_ADDRESS, resolveL2Name } from 'thirdweb/extensions/ens';
import { base } from 'thirdweb/chains';
import { formatAddress } from '@/utils/leaderboardUtils';

interface AddressDisplayProps {
  address: string;
  className?: string;
}

/**
 * Component that displays an address with ENS or Base name resolution.
 * Falls back to formatted address if no name is found.
 */
export function AddressDisplay({ address, className }: AddressDisplayProps) {
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

  const displayName = ensName || basename || formatAddress(address);

  return (
    <span className={className} title={address}>
      {displayName}
    </span>
  );
}
