import type { TeamAttestationsResponse } from '@/types/ui';

export function countAttestationEntries(teamAttestations: TeamAttestationsResponse | null, mode: 'attestations' | 'clues') {
  if (!teamAttestations?.clues?.length) return 0;
  let total = 0;
  for (const clue of teamAttestations.clues) {
    for (const entry of clue.attempts) {
      if (mode === 'clues' && entry.type !== 'solve') continue;
      total += 1;
    }
  }
  return total;
}
