import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { FaTrophy, FaMedal } from "react-icons/fa";
import { BsTrophyFill } from "react-icons/bs";
import { cn } from "@/lib/utils";

// Mock leaderboard data based on the structure from leaderboard.js
const mockLeaderboardData = [
  {
    rank: 1,
    teamId: 1,
    teamLeaderAddress: "0x1234567890abcdef1234567890abcdef12345678",
    totalTime: 1200, // 20 minutes in seconds
    totalAttempts: 8,
    cluesCompleted: 5,
    solvers: ["0x1234567890abcdef1234567890abcdef12345678", "0xabcdef1234567890abcdef1234567890abcdef12"],
    solverCount: 2,
    combinedScore: 28.0, // (1200/60) + (8*5) = 20 + 40 = 60, but optimized scoring
  },
  {
    rank: 2,
    teamId: 2,
    teamLeaderAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
    totalTime: 1500, // 25 minutes
    totalAttempts: 12,
    cluesCompleted: 5,
    solvers: ["0xabcdef1234567890abcdef1234567890abcdef12"],
    solverCount: 1,
    combinedScore: 45.0,
  },
  {
    rank: 3,
    teamId: 3,
    teamLeaderAddress: "0x9876543210fedcba9876543210fedcba98765432",
    totalTime: 1800, // 30 minutes
    totalAttempts: 15,
    cluesCompleted: 4,
    solvers: ["0x9876543210fedcba9876543210fedcba98765432", "0xfedcba9876543210fedcba9876543210fedcba98", "0x1111111111111111111111111111111111111111"],
    solverCount: 3,
    combinedScore: 60.0,
  },
  {
    rank: 4,
    teamId: 4,
    teamLeaderAddress: "0x2222222222222222222222222222222222222222",
    totalTime: 2100, // 35 minutes
    totalAttempts: 18,
    cluesCompleted: 4,
    solvers: ["0x2222222222222222222222222222222222222222", "0x3333333333333333333333333333333333333333"],
    solverCount: 2,
    combinedScore: 75.0,
  },
  {
    rank: 5,
    teamId: 5,
    teamLeaderAddress: "0x4444444444444444444444444444444444444444",
    totalTime: 2400, // 40 minutes
    totalAttempts: 20,
    cluesCompleted: 3,
    solvers: ["0x4444444444444444444444444444444444444444"],
    solverCount: 1,
    combinedScore: 100.0,
  },
  {
    rank: 6,
    teamId: 6,
    teamLeaderAddress: "0x5555555555555555555555555555555555555555",
    totalTime: 2700, // 45 minutes
    totalAttempts: 22,
    cluesCompleted: 3,
    solvers: ["0x5555555555555555555555555555555555555555", "0x6666666666666666666666666666666666666666"],
    solverCount: 2,
    combinedScore: 125.0,
  },
  {
    rank: 7,
    teamId: 7,
    teamLeaderAddress: "0x7777777777777777777777777777777777777777",
    totalTime: 3000, // 50 minutes
    totalAttempts: 25,
    cluesCompleted: 2,
    solvers: ["0x7777777777777777777777777777777777777777"],
    solverCount: 1,
    combinedScore: 150.0,
  },
  {
    rank: 8,
    teamId: 8,
    teamLeaderAddress: "0x8888888888888888888888888888888888888888",
    totalTime: 3300, // 55 minutes
    totalAttempts: 28,
    cluesCompleted: 2,
    solvers: ["0x8888888888888888888888888888888888888888", "0x9999999999999999999999999999999999999999", "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
    solverCount: 3,
    combinedScore: 175.0,
  },
];

interface LeaderboardProps {
  huntId?: string;
  huntName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function Leaderboard({ huntId, huntName, isOpen, onClose }: LeaderboardProps) {
  const [hoveredTeam, setHoveredTeam] = useState<number | null>(null);

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
          <DialogTitle className="text-xl font-bold text-center text-green">
            <BsTrophyFill className="inline-block mr-2" />
            Leaderboard
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

              {/* Leaderboard Entries */}
              {mockLeaderboardData.map((team) => (
                <div
                  key={team.teamId}
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
                        className="font-medium text-sm text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => setHoveredTeam(hoveredTeam === team.teamId ? null : team.teamId)}
                        title="Click to see team leader address"
                      >
                        Team #{team.teamId}
                      </div>
                      {hoveredTeam === team.teamId && (
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
                <strong>Scoring:</strong> Lower scores are better. Rankings update in real-time.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
