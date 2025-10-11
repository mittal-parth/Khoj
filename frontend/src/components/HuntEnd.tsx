import { useParams } from "react-router-dom";
import { FaCoins, FaRegClock, FaCheckCircle } from "react-icons/fa";
import { BsBarChartFill } from "react-icons/bs";
import { Confetti } from "./ui/confetti";
import { Button } from "./ui/button";
import { Leaderboard } from "./Leaderboard";
import { useEffect, useState } from "react";
import { useReadContract } from "thirdweb/react";
import { getContract } from "thirdweb";
import { huntABI } from "../assets/hunt_abi";
import { useNetworkState } from "../lib/utils";
import { toast } from "sonner";
import { client } from "../lib/client";
import { Hunt } from "../types";

// Type guard to ensure address is a valid hex string
function isValidHexAddress(address: string): address is `0x${string}` {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

export function HuntEnd() {
  const { huntId } = useParams();
  const [progress, setProgress] = useState(0);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  // Use the reactive network state hook
  const { contractAddress, currentChain } = useNetworkState();

  // Create thirdweb contract instance
  const contract = getContract({
    client,
    chain: currentChain,
    address: contractAddress as `0x${string}`,
    abi: huntABI,
  });

  // Get hunt details from contract - now returns HuntInfo struct directly
  const { data: huntData } = useReadContract({
    contract,
    method: "getHunt",
    params: [BigInt(huntId || 0)],
  }) as { data: Hunt | undefined };

  const trustScore = localStorage.getItem("trust_score") || "6.5";
  const score = parseInt(trustScore);

  useEffect(() => {
    // Animate the progress from 0 to the actual score
    const timer = setTimeout(() => {
      setProgress(score);
    }, 100);
    return () => clearTimeout(timer);
  }, [score]);

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
    <div className="min-h-screen bg-gradient-to-b from-green/10 to-white pt-20 px-4 mb-20">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8 border-2 border-black">
          {/* Header */}
          <div className="bg-green p-6 text-white">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold my-4">{huntInfo.title}</h1>
              <Button
                onClick={() => setIsLeaderboardOpen(true)}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 p-2"
                size="sm"
              >
                <BsBarChartFill className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Success Content */}
          <div className="p-12 flex flex-col items-center">

            {/* Trust Score Card */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8 w-full max-w-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FaRegClock className="text-green" />
                  <span className="text-sm text-gray-600">Speed</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="text-green" />
                  <span className="text-sm text-gray-600">Accuracy</span>
                </div>
              </div>
              <div className="relative flex items-center justify-center">
                {/* Animated circular progress */}
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      className="stroke-gray-200"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      className="stroke-green"
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
                    <span className="text-5xl font-bold text-green">
                      {trustScore}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-500 text-center mt-4">
                by True Network
              </div>
            </div>

            {/* Confetti Effect */}
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

            {/* Success Message */}
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
              Treasure Found! 🏆
            </h2>
            <p className="text-md text-gray-600 mb-6 text-center">
              {huntInfo.description}
            </p>

            {/* Reward Display */}
            <div className="bg-gray-50 rounded-xl p-6 flex items-center gap-4">
              <FaCoins className="w-8 h-8 text-yellow" />
              <div>
                <p className="text-sm text-gray-600">Your Reward</p>
                <p className="text-2xl font-bold text-green">
                  {huntInfo.totalReward}
                </p>
              </div>
            </div>

            {/* Claim Button */}
            {/* <Button
              onClick={handleClaim}
              size="lg"
              className="bg-green hover:bg-light-green text-white px-12 py-6 text-xl shadow-lg shadow-green/20 transition-all hover:scale-105"
            >
              <FaCoins className="mr-2" />
              Claim Your Treasure
            </Button> */}
          </div>
        </div>
        
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
