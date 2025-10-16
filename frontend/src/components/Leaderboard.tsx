import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { FaTrophy, FaMedal } from "react-icons/fa";
import { BsTrophyFill } from "react-icons/bs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const BACKEND_URL = import.meta.env.VITE_PUBLIC_BACKEND_URL;

// Leaderboard data interface based on backend response
interface LeaderboardEntry {
  rank: number;
  teamIdentifier: string;
  teamName?: string;
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

  // Fetch leaderboard data when component opens
  useEffect(() => {
    if (isOpen && huntId) {
      fetchLeaderboard();
    }
  }, [isOpen, huntId]);

  const fetchLeaderboard = async () => {
    if (!huntId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${BACKEND_URL}/leaderboard/${huntId}`);
      
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
      console.error("Error fetching leaderboard:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch leaderboard");
      toast.error("Failed to load leaderboard");
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <FaTrophy className="w-6 h-6 text-yellow-500" style={{ color: '#FFD700' }} />;
      case 2:
        return <FaMedal className="w-6 h-6" style={{ color: '#C0C0C0' }} />;
      case 3:
        return <FaMedal className="w-6 h-6" style={{ color: '#CD7F32' }} />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-500">#{rank}</span>;
    }
  };


  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getScoreColor = (score: number) => {
    if (score <= 30) return "text-green-600";
    if (score <= 50) return "text-yellow-600";
    if (score <= 75) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-[90vw] !bg-white rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center text-green flex items-center justify-center">
            <BsTrophyFill className="inline-block mr-2" />
            Leaderboard
            <button 
              onClick={fetchLeaderboard}
              disabled={isLoading}
              className="ml-4 p-1 rounded hover:bg-gray-100 disabled:opacity-50"
              title="Refresh leaderboard"
            >
              <svg 
                className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col max-h-[60vh]">
          {/* Hunt Name */}
          <div className="text-center mb-4 px-4">
            <h3 className="text-sm text-gray-500">
              {huntName || (huntId ? `Hunt #${huntId}` : 'Treasure Hunt Adventure')}
            </h3>
          </div>

          {/* Table Header - Sticky */}
          <div className="px-2">
            <div className="grid grid-cols-4 gap-2 p-3 mb-2 rounded-lg font-semibold text-sm text-gray-700 sticky top-0 z-10 shadow-sm text-center bg-white">
              <div>Rank</div>
              <div>Team</div>
              <div>Clues</div>
              <div>Score</div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-1 px-2">
            <div className="space-y-2">
              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500">Loading leaderboard...</div>
                </div>
              )}

              {/* Error State */}
              {error && !isLoading && (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="text-red-500 mb-2">Failed to load leaderboard</div>
                  <button 
                    onClick={fetchLeaderboard}
                    className="text-blue-500 hover:text-blue-700 underline"
                  >
                    Try again
                  </button>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && !error && leaderboardData.length === 0 && (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500">No teams have solved any clues yet</div>
                </div>
              )}

              {/* Leaderboard Entries */}
              {!isLoading && !error && leaderboardData.map((team) => (
                <div
                  key={team.teamIdentifier}
                  className={cn(
                    "grid grid-cols-4 gap-2 p-3 rounded-lg border transition-colors hover:bg-gray-50",
                    team.rank === 1 ? "!border-yellow-400" :
                    team.rank === 2 ? "!border-gray-300" :
                    team.rank === 3 ? "!border-orange-400" :
                    "bg-white border-gray-200"
                  )}
                  style={team.rank === 1 ? { borderColor: '#facc15' } :
                         team.rank === 3 ? {  borderColor: '#fb923c' } :
                         undefined}
                >
                  {/* Rank */}
                  <div className="flex items-center justify-center">
                    {getRankIcon(team.rank)}
                  </div>

                  {/* Team */}
                  <div className="flex items-center space-x-2">
                    <div className="min-w-0 flex-1 relative">
                      <div 
                        className="font-medium text-sm text-gray-900 cursor-pointer hover:text-blue-600 transition-colors truncate"
                        onClick={() => setHoveredTeam(hoveredTeam === team.teamIdentifier ? null : team.teamIdentifier)}
                        title={team.teamName || (team.teamIdentifier.startsWith('0x') ? `Solo: ${formatAddress(team.teamIdentifier)}` : `Team #${team.teamIdentifier}`)}
                      >
                        {team.teamName 
                          ? team.teamName.length > 18 ? `${team.teamName.slice(0, 15)}...` : team.teamName
                          : (team.teamIdentifier.startsWith('0x') 
                              ? `Solo: ${formatAddress(team.teamIdentifier)}` 
                              : `Team #${team.teamIdentifier}`)}
                      </div>
                      {hoveredTeam === team.teamIdentifier && (
                        <div className="absolute top-full left-0 mt-1 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-20 whitespace-nowrap">
                          Leader: {formatAddress(team.teamLeaderAddress)}
                          <div className="absolute -top-1 left-2 w-2 h-2 bg-gray-800 transform rotate-45"></div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Clues Solved */}
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green">
                        {team.cluesCompleted}
                      </div>
                    </div>
                  </div>

                  {/* HuntScore */}
                  <div className="flex items-center justify-center">
                    <div className={cn("text-sm font-bold", getScoreColor(team.combinedScore))}>
                      {team.combinedScore.toFixed(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-4 pt-3 border-t border-gray-200 px-4 pb-4">
            <div className="text-xs text-gray-500 text-center">
              <p>
                <strong>Scoring:</strong> Score = (Time in minutes) + (Attempts × 5). Lower scores rank higher. Rankings update in real-time.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
