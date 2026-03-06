import { useEffect, type ReactNode } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { BadgeCheck, ChevronDown, ChevronRight, ExternalLink, Map as MapIcon, Puzzle, ScrollText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Collapsible, CollapsibleContent } from './ui/collapsible';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import WalletWrapper from './WalletWrapper';
import { AttestationTimeline } from './AttestationTimeline';
import { ProfileStatsSkeleton, ProfileHuntCardsSkeleton } from './ProfileSkeleton';
import { useNetworkState } from '../lib/utils';
import { statAccents, type StatAccentKey } from '../lib/styles';
import type { Hunt } from '../types';
import type { HuntStatus, TeamAttestationsResponse } from '@/types/ui';
import { useProfileData } from '@/hooks/useProfileData';

const SIGN_EXPLORER_BASE = 'https://scan.sign.global/attestation/';

function getHuntStatus(startTime: bigint, endTime: bigint): HuntStatus {
  const now = Math.floor(Date.now() / 1000);
  const start = Number(startTime);
  const end = Number(endTime);
  if (now < start) return 'upcoming';
  if (now > end) return 'ended';
  return 'active';
}

interface HuntParticipationCardProps {
  hunt: Hunt;
  teamIdentifier: string | undefined;
  summary: { rank: number; score: number; cluesSolved: number; teamName?: string } | undefined;
  expanded: boolean;
  onExpandedChange: (open: boolean) => void;
  teamAttestations: TeamAttestationsResponse | null;
  isLoadingAttestations: boolean;
  onRequestAttestations: () => void;
}

function HuntParticipationCard({
  hunt,
  teamIdentifier,
  summary,
  expanded,
  onExpandedChange,
  teamAttestations,
  isLoadingAttestations,
  onRequestAttestations,
}: HuntParticipationCardProps) {
  useEffect(() => {
    if (expanded && teamIdentifier) {
      onRequestAttestations();
    }
  }, [expanded, teamIdentifier, onRequestAttestations]);

  const status = getHuntStatus(hunt.startTime, hunt.endTime);
  const statusLabel = status === 'active' ? 'Active' : status === 'upcoming' ? 'Upcoming' : 'Ended';
  const statusBadgeClasses =
    status === 'active'
      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
      : status === 'upcoming'
        ? 'bg-amber-50 border-amber-200 text-amber-800'
        : 'bg-slate-100 border-slate-200 text-slate-700';

  return (
    <Card className="rounded-2xl p-4 bg-white relative before:absolute before:inset-0 before:rounded-2xl before:border-8 before:border-green before:-translate-x-2 before:translate-y-2 before:-z-10 border-[3px] border-black">
      <Collapsible open={expanded} onOpenChange={onExpandedChange}>
        <CardContent className="p-0">
          <button
            type="button"
            aria-expanded={expanded}
            aria-label={`Toggle ${hunt.name} details`}
            className="w-full flex items-center justify-between text-left"
            onClick={() => onExpandedChange(!expanded)}
          >
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-foreground truncate">{hunt.name}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-foreground/80">
                <span className={`inline-flex items-center rounded-full border-2 px-2 py-0.5 font-medium ${statusBadgeClasses}`}>
                  {statusLabel}
                </span>
                {summary && (
                  <>
                    <span className="inline-flex items-center gap-1 rounded-full border-2 border-black bg-amber-50/70 px-2 py-0.5 font-medium">
                      <Puzzle className="h-3.5 w-3.5" />
                      {summary.cluesSolved}
                    </span>
                    {summary.rank > 0 && (
                      <span className="inline-flex items-center rounded-full border-2 border-black bg-violet-50/70 px-2 py-0.5 font-medium">
                        Rank #{summary.rank}
                      </span>
                    )}
                    {summary.score > 0 && (
                      <span className="inline-flex items-center rounded-full border-2 border-black bg-emerald-50/70 px-2 py-0.5 font-medium">
                        Score {summary.score.toFixed(1)}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
            <span
              aria-hidden="true"
              className="h-8 w-8 shrink-0 inline-flex items-center justify-center rounded-md border-2 border-black bg-background/70"
            >
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </span>
          </button>
          <CollapsibleContent>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-foreground">Attestations</div>
                  <div className="text-xs text-foreground/60">Tap the external icon to open Sign Explorer.</div>
                </div>
                <div className="shrink-0 text-xs text-foreground/70">
                  {isLoadingAttestations ? 'Loading…' : `${countAttestationEntries(teamAttestations, 'attestations')} total`}
                </div>
              </div>
              <AttestationTimeline teamAttestations={teamAttestations} isLoading={isLoadingAttestations} />
            </div>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
}

function countAttestationEntries(teamAttestations: TeamAttestationsResponse | null, mode: 'attestations' | 'clues') {
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

function StatCard({
  icon,
  value,
  label,
  onClick,
  accent = 'green',
}: {
  icon: ReactNode;
  value: ReactNode;
  label: string;
  onClick?: () => void;
  accent?: StatAccentKey;
}) {
  const clickable = Boolean(onClick);
  const a = statAccents[accent];
  return (
    <Card
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick?.();
            }
          : undefined
      }
      className={[
        'rounded-2xl relative before:absolute before:inset-0 before:rounded-2xl before:border-8 before:border-green before:-translate-x-1.5 before:translate-y-1.5 before:-z-10 border-[3px] border-black',
        a.bg,
        'p-3',
        clickable ? `cursor-pointer ${a.hover} focus:outline-hidden focus:ring-2 focus:ring-black` : '',
      ].join(' ')}
      aria-label={clickable ? label : undefined}
    >
      <CardContent className="p-0 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-3xl sm:text-4xl font-extrabold leading-none text-foreground tabular-nums">
            {value}
          </div>
          <div className="mt-1 text-[10px] sm:text-xs font-medium uppercase tracking-wide text-foreground/70 truncate">
            {label}
          </div>
        </div>
        <div className={`h-10 w-10 shrink-0 rounded-xl border-2 border-black ${a.iconBg} flex items-center justify-center ${a.iconColor}`}>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

export function Profile() {
  const account = useActiveAccount();
  const address = account?.address;
  const { chainId, contractAddress: rawContractAddress, currentChain } = useNetworkState();
  const {
    contract,
    hasValidContract,
    huntsLoading,
    participatedHunts,
    summaryByHunt,
    teamIdsByHunt,
    expandedByHunt,
    setExpandedByHunt,
    teamAttestationsByHunt,
    isLoadingAttestationsByHunt,
    attestationsDialog,
    setAttestationsDialog,
    hasAnyAttestationsLoaded,
    totalCluesSolved,
    totalAttestations,
    totalSolveAttestations,
    fetchTeamAttestations,
    modalEntries,
  } = useProfileData({
    address,
    chainId,
    rawContractAddress,
    currentChain,
  });

  if (!address) {
    return (
      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-[90px]">
        <h2 className="text-3xl font-bold my-8 text-green">Profile</h2>
        <Card className="rounded-2xl p-8 bg-white relative before:absolute before:inset-0 before:rounded-2xl before:border-8 before:border-green before:-translate-x-2 before:translate-y-2 before:-z-10 border-[3px] border-black max-w-md">
          <CardHeader>
            <CardTitle className="text-xl">Connect your wallet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/80 mb-4">
              Connect your wallet to see your hunt participation, attestations, and stats.
            </p>
            <WalletWrapper text="Connect wallet" withWalletAggregator />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!contract || !hasValidContract) {
    return (
      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-[90px]">
        <h2 className="text-3xl font-bold my-8 text-green">Profile</h2>
        <p className="text-foreground/80">Invalid or missing contract for the selected network.</p>
      </div>
    );
  }

  if (huntsLoading) {
    return (
      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-[90px]">
        <h2 className="text-3xl font-bold my-8 text-green">Profile</h2>
        <ProfileStatsSkeleton />
        <div className="mt-8">
          <ProfileHuntCardsSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-[90px]">
      <h2 className="text-3xl font-bold my-8 text-green">Profile</h2>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <StatCard
          accent="green"
          icon={<MapIcon className="h-5 w-5" />}
          value={participatedHunts.length}
          label="Hunts"
        />
        <StatCard
          accent="amber"
          icon={<Puzzle className="h-5 w-5" />}
          value={totalCluesSolved}
          label="Clues"
          onClick={() => setAttestationsDialog({ open: true, mode: 'clues' })}
        />
        <StatCard
          accent="violet"
          icon={<BadgeCheck className="h-5 w-5" />}
          value={hasAnyAttestationsLoaded ? totalAttestations : '—'}
          label="Attestations"
          onClick={() => setAttestationsDialog({ open: true, mode: 'attestations' })}
        />
      </div>

      {/* Hunt list */}
      <div>
        <div className="flex items-end justify-between gap-3 mb-4">
          <h3 className="text-xl font-semibold text-foreground">Your hunts</h3>
          <div className="text-xs text-foreground/60">Tap a hunt to expand & view attestations.</div>
        </div>
        {participatedHunts.length === 0 ? (
          <p className="text-foreground/70">You have not participated in any hunts yet.</p>
        ) : (
          <div className="space-y-4">
            {participatedHunts.map(({ hunt, huntId }) => (
              <HuntParticipationCard
                key={huntId}
                hunt={hunt}
                teamIdentifier={teamIdsByHunt[huntId]}
                summary={summaryByHunt[huntId]}
                expanded={Boolean(expandedByHunt[huntId])}
                onExpandedChange={(open) => setExpandedByHunt((prev) => ({ ...prev, [huntId]: open }))}
                teamAttestations={teamAttestationsByHunt[huntId] ?? null}
                isLoadingAttestations={Boolean(isLoadingAttestationsByHunt[huntId])}
                onRequestAttestations={() => {
                  const teamIdentifier = teamIdsByHunt[huntId];
                  if (!teamIdentifier) return;
                  fetchTeamAttestations(huntId, teamIdentifier);
                }}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={attestationsDialog.open} onOpenChange={(open) => setAttestationsDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScrollText className="h-5 w-5" />
              {attestationsDialog.mode === 'clues' ? 'Solved clue attestations' : 'All attestations'}
            </DialogTitle>
            <DialogDescription>
              {attestationsDialog.mode === 'clues'
                ? `Showing ${hasAnyAttestationsLoaded ? totalSolveAttestations : 0} successful solve attestations across your hunts.`
                : `Showing ${hasAnyAttestationsLoaded ? totalAttestations : 0} attestations across your hunts.`}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto pr-1">
            {Object.values(isLoadingAttestationsByHunt).some(Boolean) && !hasAnyAttestationsLoaded ? (
              <div className="py-6 text-sm text-foreground/70">Loading attestations…</div>
            ) : modalEntries.length === 0 ? (
              <div className="py-6 text-sm text-foreground/70">No attestations found.</div>
            ) : (
              <div className="space-y-3">
                {modalEntries.map((e) => (
                  <div
                    key={`${e.huntId}-${e.attestationId}`}
                    className="rounded-xl border-2 border-black bg-white p-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-foreground truncate">{e.huntName}</div>
                      <div className="text-xs text-foreground/70">
                        Clue #{e.clueIndex} • Attempt #{e.attemptNumber} • {e.type === 'solve' ? 'Solved' : 'Retry'}
                      </div>
                    </div>
                    <a
                      href={`${SIGN_EXPLORER_BASE}${e.attestationId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border-2 border-black bg-yellow/20 px-3 py-1 text-xs font-medium text-foreground hover:bg-yellow/30 shrink-0"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
