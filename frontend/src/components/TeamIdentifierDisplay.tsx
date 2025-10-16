import { useEffect, useState } from 'react';
import { useEnsName } from 'thirdweb/react';
import { client } from '@/lib/client';
import { BASENAME_RESOLVER_ADDRESS, resolveL2Name } from 'thirdweb/extensions/ens';
import { base } from 'thirdweb/chains';
import { formatAddress } from '@/utils/leaderboardUtils';

interface TeamIdentifierDisplayProps {
  teamIdentifier: string;
}

export const isSoloParticipant = (identifier: string) => identifier.startsWith('0x');

export function TeamIdentifierDisplay({ teamIdentifier }: TeamIdentifierDisplayProps) {
  const [basename, setBasename] = useState<string | null>(null);
  const isSolo = isSoloParticipant(teamIdentifier);

  // Try ENS first
  const { data: ensName } = useEnsName({
    client,
    address: isSolo ? teamIdentifier : undefined,
  });

  // Try Basename if no ENS found
  useEffect(() => {
    if (!isSolo || ensName) return;

    resolveL2Name({
      client,
      address: teamIdentifier as `0x${string}`,
      resolverAddress: BASENAME_RESOLVER_ADDRESS,
      resolverChain: base,
    })
      .then(setBasename)
      .catch(() => setBasename(null));
  }, [isSolo, ensName, teamIdentifier]);

  const teamNameContent = !isSolo ? `Team #${teamIdentifier}` : undefined;

  const displayName = isSolo ? (ensName || basename || formatAddress(teamIdentifier)) : teamNameContent!;

  // Render the resolved name with text wrapping.
  return (
    <span className="block text-sm leading-tight break-words" title={displayName}>
      {displayName}
    </span>
  );
}
