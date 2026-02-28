import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useActiveAccount, useReadContract } from 'thirdweb/react';
import { getContract, readContract } from 'thirdweb';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Collapsible, CollapsibleContent } from './ui/collapsible';
import WalletWrapper from './WalletWrapper';
import { AttestationTimeline } from './AttestationTimeline';
import { ProfileStatsSkeleton, ProfileHuntCardsSkeleton } from './ProfileSkeleton';
import { useNetworkState } from '../lib/utils';
import { client } from '../lib/client';
import { huntABI } from '../assets/hunt_abi';
import { fetchUserHuntSummary } from '../utils/profileUtils';
import { hasRequiredHuntParams } from '../utils/validationUtils';
import type { Hunt } from '../types';
import type { HuntStatus, TeamAttestationsResponse } from '@/types/ui';

const BACKEND_URL = import.meta.env.VITE_PUBLIC_BACKEND_URL;

function isValidHexAddress(address: string): address is `0x${string}` {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

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
  huntId: number;
  teamIdentifier: string | undefined;
  summary: { rank: number; score: number; cluesSolved: number; teamName?: string } | undefined;
  chainId: string | number | undefined;
  contractAddress: string | undefined;
}

function HuntParticipationCard({
  hunt,
  huntId,
  teamIdentifier,
  summary,
  chainId,
  contractAddress,
}: HuntParticipationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [teamAttestations, setTeamAttestations] = useState<TeamAttestationsResponse | null>(null);
  const [isLoadingAttestations, setIsLoadingAttestations] = useState(false);

  const fetchAttestations = useCallback(async () => {
    if (!teamIdentifier || !hasRequiredHuntParams({ huntId: String(huntId), chainId, contractAddress })) return;
    setIsLoadingAttestations(true);
    setTeamAttestations(null);
    try {
      const url = `${BACKEND_URL}/hunts/${huntId}/teams/${encodeURIComponent(teamIdentifier)}/attestations?chainId=${chainId}&contractAddress=${contractAddress}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch attestations: ${response.status}`);
      const data: TeamAttestationsResponse = await response.json();
      setTeamAttestations(data);
    } catch (err) {
      console.error('Error fetching attestations:', (err as Error)?.message);
    } finally {
      setIsLoadingAttestations(false);
    }
  }, [huntId, teamIdentifier, chainId, contractAddress]);

  useEffect(() => {
    if (expanded && teamIdentifier) {
      fetchAttestations();
    }
  }, [expanded, teamIdentifier, fetchAttestations]);

  const status = getHuntStatus(hunt.startTime, hunt.endTime);
  const statusLabel = status === 'active' ? 'Active' : status === 'upcoming' ? 'Upcoming' : 'Ended';

  return (
    <Card className="rounded-2xl p-4 bg-white relative before:absolute before:inset-0 before:rounded-2xl before:border-8 before:border-green before:-translate-x-2 before:translate-y-2 before:-z-10 border-[3px] border-black">
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CardContent className="p-0">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setExpanded((e) => !e)}
          >
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-foreground truncate">{hunt.name}</h3>
              <div className="flex items-center gap-3 mt-1 text-sm text-foreground/70">
                <span>{statusLabel}</span>
                {summary && (
                  <>
                    <span>Clues: {summary.cluesSolved}</span>
                    {summary.rank > 0 && <span>Rank #{summary.rank}</span>}
                    {summary.score > 0 && <span>Score: {summary.score.toFixed(1)}</span>}
                  </>
                )}
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
          <CollapsibleContent>
            <div className="mt-4 pt-4 border-t border-border">
              <AttestationTimeline teamAttestations={teamAttestations} isLoading={isLoadingAttestations} />
            </div>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
}

export function Profile() {
  const account = useActiveAccount();
  const address = account?.address;
  const { chainId, contractAddress: rawContractAddress, currentChain } = useNetworkState();
  const [teamIdsByHunt, setTeamIdsByHunt] = useState<Record<number, string>>({});
  const [summaryByHunt, setSummaryByHunt] = useState<
    Record<number, { rank: number; score: number; cluesSolved: number; teamName?: string }>
  >({});
  const requestedSummariesRef = useRef<Set<number>>(new Set());

  const contract = useMemo(() => {
    if (!rawContractAddress || !isValidHexAddress(rawContractAddress)) return null;
    if (rawContractAddress === '0x0000000000000000000000000000000000000000') return null;
    return getContract({
      client,
      chain: currentChain,
      address: rawContractAddress as `0x${string}`,
      abi: huntABI,
    });
  }, [rawContractAddress, currentChain]);

  const { data: huntsData = [], isLoading: huntsLoading } = useReadContract({
    contract: contract!,
    method: 'getAllHunts',
    params: [],
  });

  const hunts = huntsData as Hunt[];
  const participatedHunts = useMemo(() => {
    if (!address || !hunts?.length) return [];
    return hunts
      .map((hunt, index) => ({ hunt, huntId: index }))
      .filter(({ hunt }) => hunt.participants?.includes(address));
  }, [hunts, address]);

  // Fetch team identifier for each participated hunt
  useEffect(() => {
    if (!contract || !address || participatedHunts.length === 0) return;
    let cancelled = false;
    (async () => {
      const next: Record<number, string> = {};
      for (const { huntId } of participatedHunts) {
        if (cancelled) break;
        try {
          const teamId = await readContract({
            contract: contract!,
            method: 'getParticipantTeamId',
            params: [BigInt(huntId), address as `0x${string}`],
          });
          const teamIdentifier = teamId > 0n ? teamId.toString() : address;
          next[huntId] = teamIdentifier;
        } catch {
          next[huntId] = address;
        }
      }
      if (!cancelled) setTeamIdsByHunt((prev) => ({ ...prev, ...next }));
    })();
    return () => {
      cancelled = true;
    };
  }, [contract, address, participatedHunts]);

  // Fetch leaderboard summary for each hunt when we have team identifier
  useEffect(() => {
    if (!chainId || !rawContractAddress) return;
    for (const { huntId } of participatedHunts) {
      const teamIdentifier = teamIdsByHunt[huntId];
      if (!teamIdentifier || summaryByHunt[huntId] || requestedSummariesRef.current.has(huntId)) continue;
      requestedSummariesRef.current.add(huntId);
      fetchUserHuntSummary(huntId, teamIdentifier, chainId, rawContractAddress).then((s) => {
        setSummaryByHunt((prev) =>
          prev[huntId] ? prev : { ...prev, [huntId]: { rank: s.rank, score: s.score, cluesSolved: s.cluesSolved, teamName: s.teamName } }
        );
      });
    }
  }, [participatedHunts, teamIdsByHunt, chainId, rawContractAddress, summaryByHunt]);

  const totalCluesSolved = useMemo(
    () => Object.values(summaryByHunt).reduce((sum, s) => sum + s.cluesSolved, 0),
    [summaryByHunt]
  );

  if (!address) {
    return (
      <div className="pt-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-8">
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

  if (!contract || !rawContractAddress || !isValidHexAddress(rawContractAddress)) {
    return (
      <div className="pt-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-8">
        <h2 className="text-3xl font-bold my-8 text-green">Profile</h2>
        <p className="text-foreground/80">Invalid or missing contract for the selected network.</p>
      </div>
    );
  }

  if (huntsLoading) {
    return (
      <div className="pt-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-8">
        <h2 className="text-3xl font-bold my-8 text-green">Profile</h2>
        <ProfileStatsSkeleton />
        <div className="mt-8">
          <ProfileHuntCardsSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-8">
      <h2 className="text-3xl font-bold my-8 text-green">Profile</h2>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="rounded-2xl p-4 flex flex-col gap-2 bg-white relative before:absolute before:inset-0 before:rounded-2xl before:border-8 before:border-green before:-translate-x-2 before:translate-y-2 before:-z-10 border-[3px] border-black">
          <CardHeader className="p-0">
            <CardTitle className="text-sm font-medium text-foreground/80">Hunts participated</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <span className="text-2xl font-bold text-foreground">{participatedHunts.length}</span>
          </CardContent>
        </Card>
        <Card className="rounded-2xl p-4 flex flex-col gap-2 bg-white relative before:absolute before:inset-0 before:rounded-2xl before:border-8 before:border-green before:-translate-x-2 before:translate-y-2 before:-z-10 border-[3px] border-black">
          <CardHeader className="p-0">
            <CardTitle className="text-sm font-medium text-foreground/80">Total clues solved</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <span className="text-2xl font-bold text-foreground">{totalCluesSolved}</span>
          </CardContent>
        </Card>
        <Card className="rounded-2xl p-4 flex flex-col gap-2 bg-white relative before:absolute before:inset-0 before:rounded-2xl before:border-8 before:border-green before:-translate-x-2 before:translate-y-2 before:-z-10 border-[3px] border-black">
          <CardHeader className="p-0">
            <CardTitle className="text-sm font-medium text-foreground/80">Total attestations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <span className="text-2xl font-bold text-foreground">{totalCluesSolved}</span>
          </CardContent>
        </Card>
      </div>

      {/* Hunt list */}
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-4">Your hunts</h3>
        {participatedHunts.length === 0 ? (
          <p className="text-foreground/70">You have not participated in any hunts yet.</p>
        ) : (
          <div className="space-y-4">
            {participatedHunts.map(({ hunt, huntId }) => (
              <HuntParticipationCard
                key={huntId}
                hunt={hunt}
                huntId={huntId}
                teamIdentifier={teamIdsByHunt[huntId]}
                summary={summaryByHunt[huntId]}
                chainId={chainId}
                contractAddress={rawContractAddress}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
