import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { FaTrophy, FaMedal } from 'react-icons/fa';
import { FiRefreshCw } from 'react-icons/fi';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { TeamIdentifierDisplay, isSoloParticipant } from './TeamIdentifierDisplay';
import { AddressDisplay } from './AddressDisplay';
import { useNetworkState } from '../lib/utils';

const BACKEND_URL = import.meta.env.VITE_PUBLIC_BACKEND_URL;

// Leaderboard data interface based on backend response
interface LeaderboardEntry {
  rank: number;
  teamIdentifier: string;
  teamLeaderAddress: string;
  totalTime: number;
  totalAttempts: number;
  cluesCompleted: number;
  solvers: string[];
  solverCount: number;
  combinedScore: number;
}

interface LeaderboardProps {
  huntId?: string;
  huntName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function Leaderboard({ huntId, huntName, isOpen, onClose }: LeaderboardProps) {
  const [hoveredTeam, setHoveredTeam] = useState<string | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { chainId } = useNetworkState();

  // Fetch leaderboard data when component opens
  useEffect(() => {
    if (isOpen && huntId && chainId) {
      fetchLeaderboard();
    }
  }, [isOpen, huntId, chainId]);

  const fetchLeaderboard = async () => {
    if (huntId === undefined || chainId === undefined) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/leaderboard/${huntId}?chainId=${chainId}`);

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
      console.error('Error fetching leaderboard:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard');
      toast.error('Failed to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <FaTrophy className="w-5 h-5 text-yellow-500" style={{ color: '#FFD700' }} />;
      case 2:
        return <FaMedal className="w-5 h-5" style={{ color: '#C0C0C0' }} />;
      case 3:
        return <FaMedal className="w-5 h-5" style={{ color: '#CD7F32' }} />;
      default:
        return (
          <span className="w-5 h-5 flex items-center justify-center text-xs font-bold text-gray-500">
            #{rank}
          </span>
        );
    }
  };

  const getScoreColor = (score: number) => {
    if (score <= 400) return 'text-green-600';
    if (score <= 800) return 'text-yellow-600';
    if (score <= 1200) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[95vw] sm:w-[90vw] bg-white">
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboardData.map((team, index) => (
                    <TableRow
                      key={team.teamIdentifier}
                      className={cn(
                        'hover:bg-muted/50 transition-colors',
                        index === leaderboardData.length - 1 && 'border-b-0',
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
                            <TeamIdentifierDisplay teamIdentifier={team.teamIdentifier} />
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
                    </TableRow>
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
