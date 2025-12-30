import { useParams } from "react-router-dom";
import { FaCoins, FaRegClock, FaCheckCircle } from "react-icons/fa";
import { BsBarChartFill } from "react-icons/bs";
import { Confetti } from "./ui/confetti";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Leaderboard } from "./Leaderboard";
import { useEffect, useState } from "react";
import { useReadContract, useActiveAccount } from "thirdweb/react";
import { getContract } from "thirdweb";
import { huntABI } from "../assets/hunt_abi";
import { useNetworkState } from "../lib/utils";
import { toast } from "@/components/ui/toast";
import { client } from "../lib/client";
import { Hunt, Team } from "../types";
import { fetchTeamCombinedScore } from "../utils/leaderboardUtils";
import { isValidHexAddress, hasRequiredHuntParams } from "../utils/validationUtils";
import { getTeamIdentifier } from "../utils/progressUtils";

export function HuntEnd() {
  const { huntId } = useParams();
  const [progress, setProgress] = useState(0);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [teamScore, setTeamScore] = useState<number | null>(null);
  const [isLoadingScore, setIsLoadingScore] = useState(true);
  const [hasShownConfetti, setHasShownConfetti] = useState(false);

  // Use the reactive network state hook
  const { contractAddress, currentChain, chainId } = useNetworkState();

  // Create thirdweb contract instance
  const contract = getContract({
    client,
    chain: currentChain,
    address: contractAddress as `0x${string}`,
    abi: huntABI,
  });

  const account = useActiveAccount();
  const userWallet = account?.address;

  // Get hunt details from contract - now returns HuntInfo struct directly
  const { data: huntData } = useReadContract({
    contract,
    method: "getHunt",
    params: [BigInt(huntId || 0)],
  }) as { data: Hunt | undefined };

  // Fetch team data to get teamId
  const { data: teamData } = useReadContract({
    contract,
    method: "getTeam",
    params: [BigInt(huntId || 0), userWallet as `0x${string}`],
    queryOptions: { enabled: !!userWallet },
  }) as { data: Team | undefined };

  // Fetch team score from leaderboard
  useEffect(() => {
    const loadTeamScore = async () => {
      if (!hasRequiredHuntParams({ huntId, chainId, contractAddress }) || !userWallet) {
        setIsLoadingScore(false);
        console.log("Team score loading failed because of missing params");
        return;
      }

      try {
        console.log("Fetching team score");
        // Use getTeamIdentifier to handle both teams and solo participants
        // For teams: uses teamData.teamId, for solo: uses userWallet
        const teamIdentifier = getTeamIdentifier(teamData, userWallet);
        const score = await fetchTeamCombinedScore(huntId!, teamIdentifier, chainId!, contractAddress!);
        setTeamScore(score);
        // Trigger confetti only once when score is successfully loaded
        if (!hasShownConfetti) {
          setHasShownConfetti(true);
        }
      } catch (error) {
        console.error("Error fetching team score:", error);
        setTeamScore(0.0);
      } finally {
        setIsLoadingScore(false);
      }
    };

    loadTeamScore();
  }, [huntId, teamData, chainId, contractAddress, userWallet]);

  // Use dynamic score or show loading state
  const trustScore = teamScore !== null ? teamScore.toString() : "...";
  const score = teamScore !== null ? teamScore : 0;

  useEffect(() => {
    // Only animate progress when score is actually loaded (not loading)
    if (!isLoadingScore && teamScore !== null) {
      const timer = setTimeout(() => {
        setProgress(score);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [score, isLoadingScore, teamScore]);

  if (!isValidHexAddress(contractAddress)) {
    toast.error("Invalid contract address format");
    return null;
  }

  // Use dynamic title, static reward/description
  const huntInfo = {
    title: huntData?.name || "...",
    totalReward: "Swags!! 🎁",
    description:
      "You've successfully completed all the challenges and found the treasure! Please contact the organizers for next steps.",
  };

  // const handleClaim = async () => {
  //   // Add claim logic here
  //   console.log(huntId);
  //   console.log("Claiming reward...");
  // };

  return (
    <div className="min-h-screen bg-background pt-20 px-4 mb-[90px]">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Hunt Completion Card */}
        <Card className="bg-white">
          <CardHeader className="bg-main text-main-foreground p-6 border-b-2 border-black -my-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold">
                {huntInfo.title}
              </CardTitle>
              <Button
                onClick={() => setIsLeaderboardOpen(true)}
                variant="neutral"
                size="sm"
                className="p-2"
              >
                <BsBarChartFill className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* Success Message */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-8">
                Treasure Found! 🏆
              </h2>
              <p className="text-sm text-foreground/70 font-medium text-justify px-3">
                {huntInfo.description}
              </p>
            </div>

            {/* Trust Score Card */}
            <Card className="bg-muted mb-8">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-main rounded-lg border-2 border-black">
                      <FaRegClock className="w-4 h-4 text-main-foreground" />
                    </div>
                    <span className="text-sm text-foreground/60 font-semibold uppercase tracking-wide">Speed</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-main rounded-lg border-2 border-black">
                      <FaCheckCircle className="w-4 h-4 text-main-foreground" />
                    </div>
                    <span className="text-sm text-foreground/60 font-semibold uppercase tracking-wide">Accuracy</span>
                  </div>
                </div>
                
                <div className="relative flex items-center justify-center mb-4">
                  {/* Animated circular progress */}
                  <div className="relative w-40 h-40">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        className="stroke-foreground/20"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        className="stroke-main"
                        strokeWidth="8"
                        fill="none"
                        strokeLinecap="round"
                        style={{
                          strokeDasharray: `${2 * Math.PI * 70}`,
                          strokeDashoffset: `${
                            2 * Math.PI * 70 * (1 - progress / 10)
                          }`,
                          transition: "stroke-dashoffset 1s ease-in-out",
                        }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-5xl font-bold text-main">
                        {isLoadingScore ? "..." : trustScore}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-md text-center font-medium">
                  Score = (Time in minutes) + (Attempts × 5)
                </div>
              </CardContent>
            </Card>

            {/* Reward Display */}
            <Card className="bg-accent">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-main rounded-lg border-2 border-black">
                    <FaCoins className="w-8 h-8 text-main-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-accent-foreground/70 font-semibold uppercase tracking-wide">Your Reward</p>
                    <p className="text-2xl font-bold text-accent-foreground">
                      {huntInfo.totalReward}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Confetti Effect - Only show when score is loaded and confetti hasn't been shown yet */}
            {hasShownConfetti && !isLoadingScore && (
              <Confetti
                style={{
                  position: "fixed",
                  width: "100%",
                  height: "100%",
                  top: 0,
                  left: 0,
                  zIndex: 0,
                  pointerEvents: "none",
                }}
                options={{
                  particleCount: 100,
                  spread: 70,
                  origin: { y: 0.6 },
                }}
              />
            )}
          </CardContent>
        </Card>
        
        {/* Leaderboard Modal */}
        <Leaderboard 
          huntId={huntId} 
          huntName={huntData?.name}
          isOpen={isLeaderboardOpen} 
          onClose={() => setIsLeaderboardOpen(false)} 
        />
      </div>
    </div>
  );
}
