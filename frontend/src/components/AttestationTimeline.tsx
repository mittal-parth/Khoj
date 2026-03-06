import { Check, Clock, ExternalLink, X } from 'lucide-react';
import { LeaderboardAttestationsSkeleton } from './LeaderboardSkeleton';
import { formatTimeTaken } from '@/utils/leaderboardUtils';
import type { AttestationEntry, TeamAttestationsResponse } from '@/types/ui';

const SIGN_EXPLORER_BASE = 'https://scan.sign.global/attestation/';

export interface AttestationTimelineProps {
  teamAttestations: TeamAttestationsResponse | null;
  isLoading: boolean;
}

export function AttestationTimeline({ teamAttestations, isLoading }: AttestationTimelineProps) {
  if (isLoading) {
    return (
      <div className="border-l-2 border-border/50 pl-4 py-2 space-y-4">
        <LeaderboardAttestationsSkeleton />
      </div>
    );
  }
  if (!teamAttestations || teamAttestations.clues.length === 0) {
    return <div className="py-4 text-sm text-foreground/60">No attestations found</div>;
  }
  return (
    <div className="border-l-2 border-border/50 pl-4 py-2 space-y-4">
      {teamAttestations.clues.map((clue) => (
        <div key={clue.clueIndex}>
          <div className="relative flex items-center mb-2">
            <div
              className="absolute w-2 h-2 rounded-full bg-foreground -left-[21px] top-1/2 -translate-y-1/2 shrink-0"
              aria-hidden
            />
            <span className="text-sm font-semibold text-foreground">Clue #{clue.clueIndex}</span>
          </div>
          <div className="ml-4 space-y-2">
            {clue.attempts.map((entry: AttestationEntry, i: number) => (
              <div
                key={entry.attestationId}
                className="flex items-center gap-3 text-sm"
              >
                <span className="text-foreground/80 w-24">Attempt #{i + 1}</span>
                {entry.type === 'retry' ? (
                  <X className="w-4 h-4 text-red-600 shrink-0" />
                ) : (
                  <Check className="w-4 h-4 text-green-600 shrink-0" />
                )}
                <span className="flex items-center gap-1 w-16">
                  <Clock className="w-4 h-4 text-foreground/60 shrink-0" />
                  {formatTimeTaken(entry.timeTaken)}
                </span>
                <a
                  href={`${SIGN_EXPLORER_BASE}${entry.attestationId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-main hover:underline"
                >
                  <ExternalLink className="w-4 h-4 shrink-0" />
                </a>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
