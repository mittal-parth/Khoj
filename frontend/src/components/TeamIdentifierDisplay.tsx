import { useAddressResolution } from '@/hooks/useAddressResolution';

interface TeamIdentifierDisplayProps {
  teamIdentifier: string;
}

export const isSoloParticipant = (identifier: string) => identifier.startsWith('0x');

export function TeamIdentifierDisplay({ teamIdentifier }: TeamIdentifierDisplayProps) {
  const isSolo = isSoloParticipant(teamIdentifier);
  const resolvedAddress = useAddressResolution(teamIdentifier);

  const teamNameContent = !isSolo ? `Team #${teamIdentifier}` : undefined;
  const displayName = isSolo ? resolvedAddress : teamNameContent!;

  // Render the resolved name with text wrapping.
  return (
    <span className="block text-sm leading-tight break-words" title={displayName}>
      {displayName}
    </span>
  );
}
