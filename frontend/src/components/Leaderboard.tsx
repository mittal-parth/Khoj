import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Collapsible, CollapsibleContent } from './ui/collapsible';
import { FaTrophy, FaMedal } from 'react-icons/fa';
import { FiRefreshCw } from 'react-icons/fi';
import { ChevronRight, ChevronDown, X, Check, Clock, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/toast';
import { TeamIdentifierDisplay, isSoloParticipant } from './TeamIdentifierDisplay';
import { AddressDisplay } from './AddressDisplay';
import { useNetworkState } from '../lib/utils';
import { hasRequiredHuntParams } from '../utils/validationUtils';
import { formatTimeTaken } from '../utils/leaderboardUtils';
import type { TeamAttestationsResponse, AttestationEntry, LeaderboardEntry, LeaderboardProps } from '@/types/ui';

const BACKEND_URL = import.meta.env.VITE_PUBLIC_BACKEND_URL;

const SIGN_EXPLORER_BASE = 'https://scan.sign.global/attestation/';

export function Leaderboard({ huntId, huntName, isOpen, onClose }: LeaderboardProps) {
  const [hoveredTeam, setHoveredTeam] = useState<string | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [teamAttestations, setTeamAttestations] = useState<TeamAttestationsResponse | null>(null);
  const [isLoadingAttestations, setIsLoadingAttestations] = useState(false);

  const { chainId, contractAddress } = useNetworkState();

  // Fetch leaderboard data when component opens
  useEffect(() => {
    if (isOpen && huntId && chainId && contractAddress) {
      fetchLeaderboard();
    }
  }, [isOpen, huntId, chainId, contractAddress]);

  const fetchLeaderboard = async () => {
    if (!hasRequiredHuntParams({ huntId, chainId, contractAddress })) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/hunts/${huntId}/leaderboard?chainId=${chainId}&contractAddress=${contractAddress}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch leaderboard: ${response.status}`);
      }

      const data = await response.json();

      if (data.leaderboard && Array.isArray(data.leaderboard)) {
        setLeaderboardData(data.leaderboard);
      } else {
        setLeaderboardData([]);
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', (err as Error)?.message);
      setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard');
      toast.error('Failed to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeamAttestations = useCallback(async (teamIdentifier: string) => {
    if (!hasRequiredHuntParams({ huntId, chainId, contractAddress })) return;

    setIsLoadingAttestations(true);
    setTeamAttestations(null);

    try {
      const url = `${BACKEND_URL}/hunts/${huntId}/teams/${encodeURIComponent(teamIdentifier)}/attestations?chainId=${chainId}&contractAddress=${contractAddress}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch attestations: ${response.status}`);
      }

      const data: TeamAttestationsResponse = await response.json();
      setTeamAttestations(data);
    } catch (err) {
      console.error('Error fetching team attestations:', (err as Error)?.message);
      toast.error('Failed to load attestations');
      setExpandedTeam(null);
    } finally {
      setIsLoadingAttestations(false);
    }
  }, [huntId, chainId, contractAddress]);

  const handleRowExpand = (teamIdentifier: string) => {
    if (expandedTeam === teamIdentifier) {
      setExpandedTeam(null);
      setTeamAttestations(null);
      return;
    }
    setExpandedTeam(teamIdentifier);
    fetchTeamAttestations(teamIdentifier);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <FaTrophy className="w-5 h-5 text-amber-400" />;
      case 2:
        return <FaMedal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <FaMedal className="w-5 h-5 text-amber-700" />;
      default:
        return (
          <span className="w-5 h-5 flex items-center justify-center text-xs font-bold text-gray-500">
            #{rank}
          </span>
        );
    }
  };

  const renderAttestationTimeline = () => {
    if (isLoadingAttestations) {
      return <div className="py-4 text-sm text-foreground/60">Loading attestations...</div>;
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
                  key={`${clue.clueIndex}-${i}`}
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
  };

  const getScoreColor = (score: number) => {
    if (score <= 1200) return 'text-green-600';
    if (score <= 1800) return 'text-yellow-600';
    if (score <= 2700) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl w-[95vw] sm:w-[85vw] bg-white">
        <DialogHeader className="bg-main text-main-foreground p-6 border-b-2 border-black -m-6 mb-0">
          <DialogTitle className="text-center flex items-center justify-center text-xl">
            Leaderboard
            <Button
              onClick={fetchLeaderboard}
              disabled={isLoading}
              variant="neutral"
              size="icon"
              className="ml-4"
              title="Refresh leaderboard"
            >
              <FiRefreshCw className={`w-2 h-2 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col max-h-[60vh] p-4">
          {/* Hunt Name */}
          <div className="text-center mb-4">
            <h3 className="text-sm text-foreground/60 font-semibold uppercase tracking-wide">
              {huntName || (huntId ? `Hunt #${huntId}` : 'Treasure Hunt Adventure')}
            </h3>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-foreground/60 font-medium">Loading leaderboard...</div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="text-red-600 mb-4 font-bold">Failed to load leaderboard</div>
              <Button
                onClick={fetchLeaderboard}
                variant="default"
              >
                Try again
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && leaderboardData.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <div className="text-foreground/60 font-medium">No teams have solved any clues yet</div>
            </div>
          )}

          {/* Leaderboard Table */}
          {!isLoading && !error && leaderboardData.length > 0 && (
            <div className="overflow-x-auto overflow-y-auto flex-1 -mx-4 px-4">
              <Table className="w-full">
                <TableHeader className="border-t-1 border-black">
                  <TableRow>
                    <TableHead className="text-center font-bold text-sm px-2 sm:px-4">Rank</TableHead>
                    <TableHead className="text-left font-bold text-sm px-2 sm:px-4">Team</TableHead>
                    <TableHead className="text-center font-bold text-sm px-2 sm:px-4">Clues</TableHead>
                    <TableHead className="text-center font-bold text-sm px-2 sm:px-4">Score</TableHead>
                    <TableHead className="w-8 px-2" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboardData.map((team, index) => (
                    <React.Fragment key={team.teamIdentifier}>
                      <TableRow
                        className={cn(
                          'hover:bg-muted/50 transition-colors',
                          index === leaderboardData.length - 1 && !expandedTeam && 'border-b-0',
                          team.rank === 1
                            ? 'bg-yellow-50'
                            : team.rank === 2
                              ? 'bg-gray-50'
                              : team.rank === 3
                                ? 'bg-orange-50'
                                : ''
                        )}
                      >
                        {/* Rank */}
                        <TableCell className="text-center px-2 sm:px-4">
                          {getRankIcon(team.rank)}
                        </TableCell>

                        {/* Team */}
                        <TableCell className="px-2 sm:px-4 min-w-[100px]">
                          <div className="relative">
                            <div
                              className="font-medium text-sm text-foreground cursor-pointer hover:text-main transition-colors break-all"
                              onClick={() =>
                                setHoveredTeam(
                                  hoveredTeam === team.teamIdentifier ? null : team.teamIdentifier
                                )
                              }
                              title="Click to see team leader address"
                            >
                              <TeamIdentifierDisplay
                                teamIdentifier={team.teamIdentifier}
                                teamName={team.teamName}
                              />
                            </div>
                            {hoveredTeam === team.teamIdentifier && (
                              <div className="absolute top-full left-0 mt-1 p-2 bg-foreground text-background text-xs sm:text-sm rounded-base border-2 border-black shadow-[-2px_2px_0px_0px_rgba(0,0,0,1)] z-20 whitespace-nowrap max-w-[200px] break-all">
                                {isSoloParticipant(team.teamIdentifier) ? (
                                  <span>
                                    Solo: <TeamIdentifierDisplay teamIdentifier={team.teamIdentifier} />
                                  </span>
                                ) : (
                                  <span>
                                    Team Leader: <AddressDisplay address={team.teamLeaderAddress} />
                                  </span>
                                )}
                                <div className="absolute -top-1 left-2 w-2 h-2 bg-foreground transform rotate-45"></div>
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* Clues Solved */}
                        <TableCell className="text-center px-2 sm:px-4">
                          <div className="text-base font-bold text-main">{team.cluesCompleted}</div>
                        </TableCell>

                        {/* Score */}
                        <TableCell className="text-center px-2 sm:px-4">
                          <div className={cn('text-sm font-bold', getScoreColor(team.combinedScore))}>
                            {team.combinedScore.toFixed(1)}
                          </div>
                        </TableCell>

                        {/* Expand */}
                        <TableCell className="px-2 w-8">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => handleRowExpand(team.teamIdentifier)}
                            title={expandedTeam === team.teamIdentifier ? 'Collapse' : 'View attestations'}
                          >
                            {expandedTeam === team.teamIdentifier ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expandedTeam === team.teamIdentifier && (
                        <TableRow>
                          <TableCell colSpan={5} className="bg-muted/30 p-4 align-top">
                            <Collapsible open>
                              <CollapsibleContent>
                                {renderAttestationTimeline()}
                              </CollapsibleContent>
                            </Collapsible>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Footer Info */}
          <div className="pt-4 border-t-1 border-black">
            <div className="text-xs text-foreground/60 text-center">
              <p className="font-medium">
                Score = (Time in minutes) + (Attempts × 5). Lower scores
                rank higher after number of clues solved.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
