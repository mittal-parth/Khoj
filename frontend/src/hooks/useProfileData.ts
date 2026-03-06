import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getContract, readContract } from 'thirdweb';
import { useReadContract } from 'thirdweb/react';
import { client } from '@/lib/client';
import { huntABI } from '@/assets/hunt_abi';
import { fetchUserHuntSummary } from '@/utils/profileUtils';
import { hasRequiredHuntParams } from '@/utils/validationUtils';
import type { Hunt } from '@/types';
import type { TeamAttestationsResponse } from '@/types/ui';

const BACKEND_URL = import.meta.env.VITE_PUBLIC_BACKEND_URL;
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

function isValidHexAddress(address: string): address is `0x${string}` {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
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

export function useProfileData({
  address,
  chainId,
  rawContractAddress,
  currentChain,
}: {
  address: string | undefined;
  chainId: string | number | undefined;
  rawContractAddress: string;
  currentChain: Parameters<typeof getContract>[0]['chain'];
}) {
  const [teamIdsByHunt, setTeamIdsByHunt] = useState<Record<number, string>>({});
  const [summaryByHunt, setSummaryByHunt] = useState<
    Record<number, { rank: number; score: number; cluesSolved: number; teamName?: string }>
  >({});
  const requestedSummariesRef = useRef<Set<number>>(new Set());
  const requestedAttestationsRef = useRef<Set<number>>(new Set());
  const [expandedByHunt, setExpandedByHunt] = useState<Record<number, boolean>>({});
  const [teamAttestationsByHunt, setTeamAttestationsByHunt] = useState<Record<number, TeamAttestationsResponse | null>>(
    {}
  );
  const [isLoadingAttestationsByHunt, setIsLoadingAttestationsByHunt] = useState<Record<number, boolean>>({});
  const [attestationsDialog, setAttestationsDialog] = useState<{ open: boolean; mode: 'attestations' | 'clues' }>({
    open: false,
    mode: 'attestations',
  });

  const hasValidContract = useMemo(() => {
    return Boolean(rawContractAddress && isValidHexAddress(rawContractAddress) && rawContractAddress !== ZERO_ADDRESS);
  }, [rawContractAddress]);

  const contract = useMemo(() => {
    if (!hasValidContract) return null;
    return getContract({
      client,
      chain: currentChain,
      address: rawContractAddress as `0x${string}`,
      abi: huntABI,
    });
  }, [hasValidContract, rawContractAddress, currentChain]);

  // Keep the read hook stable even when contract is not ready.
  const safeReadContract = useMemo(() => {
    return (
      contract ??
      getContract({
        client,
        chain: currentChain,
        address: ZERO_ADDRESS,
        abi: huntABI,
      })
    );
  }, [contract, currentChain]);

  const { data: huntsData = [], isLoading: huntsLoading } = useReadContract({
    contract: safeReadContract,
    method: 'getAllHunts',
    params: [],
    queryOptions: { enabled: Boolean(contract) },
  });

  const hunts = huntsData as Hunt[];
  const participatedHunts = useMemo(() => {
    if (!address || !hunts?.length) return [];
    return hunts
      .map((hunt, index) => ({ hunt, huntId: index }))
      .filter(({ hunt }) => hunt.participants?.includes(address));
  }, [hunts, address]);

  useEffect(() => {
    if (!contract || !address || participatedHunts.length === 0) return;
    let cancelled = false;
    (async () => {
      const next: Record<number, string> = {};
      for (const { huntId } of participatedHunts) {
        if (cancelled) break;
        try {
          const teamId = await readContract({
            contract,
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

  useEffect(() => {
    if (!chainId || !rawContractAddress) return;
    for (const { huntId } of participatedHunts) {
      const teamIdentifier = teamIdsByHunt[huntId];
      if (!teamIdentifier || summaryByHunt[huntId] || requestedSummariesRef.current.has(huntId)) continue;
      requestedSummariesRef.current.add(huntId);
      fetchUserHuntSummary(huntId, teamIdentifier, chainId, rawContractAddress)
        .then((summary) => {
          setSummaryByHunt((prev) => {
            if (prev[huntId]) return prev;
            return {
              ...prev,
              [huntId]: {
                rank: summary.rank,
                score: summary.score,
                cluesSolved: summary.cluesSolved,
                teamName: summary.teamName,
              },
            };
          });
        })
        .catch((error) => {
          console.error('Error fetching profile summary:', (error as Error)?.message);
          setSummaryByHunt((prev) => {
            if (prev[huntId]) return prev;
            return { ...prev, [huntId]: { rank: 0, score: 0, cluesSolved: 0 } };
          });
        });
    }
  }, [participatedHunts, teamIdsByHunt, chainId, rawContractAddress, summaryByHunt]);

  useEffect(() => {
    requestedSummariesRef.current = new Set();
    requestedAttestationsRef.current = new Set();
    setSummaryByHunt({});
    setTeamIdsByHunt({});
    setTeamAttestationsByHunt({});
    setIsLoadingAttestationsByHunt({});
    setExpandedByHunt({});
  }, [address, chainId, rawContractAddress]);

  const fetchTeamAttestations = useCallback(
    async (huntId: number, teamIdentifier: string) => {
      if (requestedAttestationsRef.current.has(huntId)) return;
      if (!hasRequiredHuntParams({ huntId: String(huntId), chainId, contractAddress: rawContractAddress })) return;

      requestedAttestationsRef.current.add(huntId);
      setIsLoadingAttestationsByHunt((prev) => ({ ...prev, [huntId]: true }));

      try {
        const url = `${BACKEND_URL}/hunts/${huntId}/teams/${encodeURIComponent(teamIdentifier)}/attestations?chainId=${chainId}&contractAddress=${rawContractAddress}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch attestations: ${response.status}`);
        const data: TeamAttestationsResponse = await response.json();
        setTeamAttestationsByHunt((prev) => ({ ...prev, [huntId]: data }));
      } catch (err) {
        console.error('Error fetching attestations:', (err as Error)?.message);
        setTeamAttestationsByHunt((prev) => ({ ...prev, [huntId]: null }));
      } finally {
        setIsLoadingAttestationsByHunt((prev) => ({ ...prev, [huntId]: false }));
      }
    },
    [chainId, rawContractAddress]
  );

  const totalCluesSolved = useMemo(
    () => Object.values(summaryByHunt).reduce((sum, summary) => sum + summary.cluesSolved, 0),
    [summaryByHunt]
  );

  const hasAnyAttestationsLoaded = useMemo(
    () => Object.keys(teamAttestationsByHunt).length > 0,
    [teamAttestationsByHunt]
  );

  const totalAttestations = useMemo(() => {
    return Object.values(teamAttestationsByHunt).reduce((sum, response) => {
      return sum + countAttestationEntries(response, 'attestations');
    }, 0);
  }, [teamAttestationsByHunt]);

  const totalSolveAttestations = useMemo(() => {
    return Object.values(teamAttestationsByHunt).reduce((sum, response) => {
      return sum + countAttestationEntries(response, 'clues');
    }, 0);
  }, [teamAttestationsByHunt]);

  useEffect(() => {
    if (!address) return;
    if (!chainId || !rawContractAddress) return;
    if (participatedHunts.length === 0) return;
    if (participatedHunts.length > 6) return;

    for (const { huntId } of participatedHunts) {
      const teamIdentifier = teamIdsByHunt[huntId];
      if (!teamIdentifier) continue;
      fetchTeamAttestations(huntId, teamIdentifier);
    }
  }, [address, chainId, rawContractAddress, participatedHunts, teamIdsByHunt, fetchTeamAttestations]);

  useEffect(() => {
    if (!attestationsDialog.open) return;
    if (!address) return;
    if (!chainId || !rawContractAddress) return;
    if (participatedHunts.length === 0) return;

    let cancelled = false;
    (async () => {
      for (const { huntId } of participatedHunts) {
        if (cancelled) break;
        const teamIdentifier = teamIdsByHunt[huntId];
        if (!teamIdentifier) continue;
        fetchTeamAttestations(huntId, teamIdentifier);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    attestationsDialog.open,
    address,
    chainId,
    rawContractAddress,
    participatedHunts,
    teamIdsByHunt,
    fetchTeamAttestations,
  ]);

  const modalEntries = useMemo(() => {
    const mode = attestationsDialog.mode;
    const entries: Array<{
      huntId: number;
      huntName: string;
      clueIndex: number;
      attemptNumber: number;
      type: 'retry' | 'solve';
      attestationId: string;
      timestamp: number;
    }> = [];

    const huntsById = new Map<number, string>();
    for (const { hunt, huntId } of participatedHunts) {
      huntsById.set(huntId, hunt.name);
    }

    for (const [huntIdStr, response] of Object.entries(teamAttestationsByHunt)) {
      const huntId = Number(huntIdStr);
      if (!response?.clues?.length) continue;
      const huntName = huntsById.get(huntId) ?? `Hunt #${huntId}`;
      for (const clue of response.clues) {
        clue.attempts.forEach((entry, index) => {
          if (mode === 'clues' && entry.type !== 'solve') return;
          entries.push({
            huntId,
            huntName,
            clueIndex: clue.clueIndex,
            attemptNumber: index + 1,
            type: entry.type,
            attestationId: entry.attestationId,
            timestamp: entry.timestamp,
          });
        });
      }
    }

    entries.sort((a, b) => b.timestamp - a.timestamp);
    return entries;
  }, [attestationsDialog.mode, participatedHunts, teamAttestationsByHunt]);

  return {
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
  };
}
