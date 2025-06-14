import { useParams, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { BsArrowLeft, BsTrophy } from "react-icons/bs";
import { FaCoins, FaRegClock, FaCheckCircle } from "react-icons/fa";
import { Confetti } from "./ui/confetti";
import { useEffect, useState } from "react";
import { useReadContract } from "thirdweb/react";
import { getContract } from "thirdweb";
import { huntABI } from "../assets/hunt_abi";
import { CONTRACT_ADDRESSES } from "../lib/utils";
import { toast } from "sonner";
import { client } from "../lib/client";
import { paseoAssetHub } from "../lib/chains";

// Type guard to ensure address is a valid hex string
function isValidHexAddress(address: string): address is `0x${string}` {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

export function HuntEnd() {
  const { huntId } = useParams();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  // Get current network and contract address
  const currentNetwork = localStorage.getItem("current_network") || "assetHub";
  const contractAddress =
    CONTRACT_ADDRESSES[currentNetwork as keyof typeof CONTRACT_ADDRESSES] ??
    "0x0000000000000000000000000000000000000000";

  // Create thirdweb contract instance
  const contract = getContract({
    client,
    chain: paseoAssetHub,
    address: contractAddress as `0x${string}`,
    abi: huntABI,
  });

  // Get hunt details from contract
  const { data: huntDetails } = useReadContract({
    contract,
    method: "getHunt",
    params: [BigInt(huntId || 0)],
  });

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
  const huntData = {
    title: huntDetails ? huntDetails[0] : "...",
    totalReward: "0.45 ETH",
    description:
      "You've successfully completed all the challenges and found the treasure!",
  };

  const handleClaim = async () => {
    // Add claim logic here
    console.log(huntId);
    console.log("Claiming reward...");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green/10 to-white pt-20 px-4 mb-20">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-green/20">
          {/* Header */}
          <div className="bg-gradient-to-r from-green to-light-green p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Button
                onClick={() => navigate("/")}
                variant="ghost"
                className="text-white hover:bg-white/20"
              >
                <BsArrowLeft className="mr-2" />
                Back to Hunts
              </Button>
            </div>
            <h1 className="text-4xl font-bold mb-2">{huntData.title}</h1>
          </div>

          {/* Success Content */}
          <div className="p-12 flex flex-col items-center">
            {/* Trophy Icon with Glow Effect */}
            <div className="mb-8 relative">
              <div className="absolute inset-0 bg-yellow/30 blur-xl rounded-full"></div>
              <BsTrophy className="w-32 h-32 text-yellow relative animate-bounce-slow" />
            </div>

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
            <h2 className="text-4xl font-bold text-gray-900 mb-4 text-center">
              Treasure Found!
            </h2>
            <p className="text-md text-gray-600 mb-8 text-center max-w-2xl">
              {huntData.description}
            </p>

            {/* Reward Display */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8 flex items-center gap-4">
              <FaCoins className="w-8 h-8 text-yellow" />
              <div>
                <p className="text-sm text-gray-600">Your Reward</p>
                <p className="text-2xl font-bold text-green">
                  {huntData.totalReward}
                </p>
              </div>
            </div>

            {/* Claim Button */}
            <Button
              onClick={handleClaim}
              size="lg"
              className="bg-green hover:bg-light-green text-white px-12 py-6 text-xl shadow-lg shadow-green/20 transition-all hover:scale-105"
            >
              <FaCoins className="mr-2" />
              Claim Your Treasure
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
