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
    <span className="block leading-tight wrap-break-word" title={displayName}>
      {displayName}
    </span>
  );
}
