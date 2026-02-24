import { useAddressResolution } from '@/hooks/useAddressResolution';

const MAX_DISPLAY_LENGTH = 18;

function truncateWithEllipsis(str: string, maxLen: number = MAX_DISPLAY_LENGTH): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1).trim() + "…";
}

interface TeamIdentifierDisplayProps {
  teamIdentifier: string;
  teamName?: string;
}

export const isSoloParticipant = (identifier: string) => identifier.startsWith('0x');

export function TeamIdentifierDisplay({ teamIdentifier, teamName }: TeamIdentifierDisplayProps) {
  const isSolo = isSoloParticipant(teamIdentifier);
  const resolvedAddress = useAddressResolution(teamIdentifier);

  const teamNameContent = !isSolo
    ? (teamName ? truncateWithEllipsis(teamName) : `Team #${teamIdentifier}`)
    : undefined;
  const displayName = isSolo ? resolvedAddress : teamNameContent!;
  const fullTitle = isSolo ? resolvedAddress : (teamName && teamName.length > MAX_DISPLAY_LENGTH ? teamName : displayName);

  return (
    <span className="block leading-tight wrap-break-word" title={fullTitle}>
      {displayName}
    </span>
  );
}
