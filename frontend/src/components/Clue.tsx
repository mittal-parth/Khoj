import { useParams, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import {
  BsArrowLeft,
  BsGeoAlt,
  BsCheckCircle,
  BsXCircle,
  BsArrowRepeat,
} from "react-icons/bs";
import { getTrueNetworkInstance } from "../../true-network/true.config";
import { huntAttestationSchema } from "@/schemas/huntSchema";
import { HuddleRoom } from './HuddleRoom';

export function Clue() {
  const { huntId, clueId } = useParams();
  const navigate = useNavigate();
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attempts, setAttempts] = useState(3);
  const [verificationState, setVerificationState] = useState<
    "idle" | "verifying" | "success" | "error"
  >("idle");

  useEffect(() => {
    setVerificationState("idle");

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const { latitude, longitude } = coords;
          console.log(latitude, longitude);
          setLocation({ latitude, longitude });
        },
        (error) => {
          console.error("Geolocation error:", error);
        }
      );
    }
  }, [clueId]);

  const currentClue = parseInt(clueId || "0");
  const currentClueData = JSON.parse(
    localStorage.getItem("hunt_riddles") || "[]"
  );

  // Mock data - replace with API call
  const huntData = {
    title: "Ethereum Treasure Quest",
    description:
      "Follow the clues across the Ethereum blockchain to find hidden treasures and win rewards!",
    totalClues: 10,
    currentClue: parseInt(clueId || "1"),
    clues: {
      1: {
        title: "The First Gateway",
        content: `
**The Challenge**

What has keys, but no locks; space, but no room; and you can enter, but not go in?

**Hints**
- Think about something you use every day
- It helps you communicate
- You're probably using it right now

**Reward**
0.1 ETH for solving this clue correctly

**Rules**
- You have 3 attempts to solve this clue
- Each wrong attempt reduces your potential reward by 0.02 ETH
- Make sure to check your location before verifying
        `,
        reward: "0.1 ETH",
        targetLocation: {
          latitude: 12.9829725,
          longitude: 77.6808016,
        },
      },
      2: {
        title: "The Crypto Conundrum",
        content: `
**The Challenge** 

I am a digital signature that proves ownership, yet I'm not a contract. I can be traded but never physically held. What am I?

**Hints**
- I'm a fundamental part of blockchain technology
- I secure your digital assets
- I come in pairs, but only one is meant to be shared

**Reward**
0.15 ETH for solving this clue correctly

**Rules**
- You have 3 attempts to solve this clue
- Each wrong attempt reduces your potential reward by 0.03 ETH
- Location verification required
        `,
        reward: "0.15 ETH",
        targetLocation: {
          latitude: 51.5074,
          longitude: -0.1278,
        },
      },
      3: {
        title: "The Smart Contract Maze",
        content: `
**The Challenge**

Navigate through the decentralized maze of logic. Find the function that unlocks the next level.

**Hints**
- Study the contract's ABI carefully
- The key lies in the event logs
- Remember to check function modifiers

**Reward**
0.2 ETH for solving this clue correctly

**Rules**
- You have 3 attempts to solve this clue
- Each wrong attempt reduces your potential reward by 0.04 ETH
- Location verification required
        `,
        reward: "0.2 ETH",
        targetLocation: {
          latitude: 40.7128,
          longitude: -74.006,
        },
      },
    },
  };

  const createHuntAttestation = async (tries: number) => {
    try {
      const api = await getTrueNetworkInstance();

      // Replace with actual user's wallet address from your auth system
      const userWallet = "0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97";

      const output = await huntAttestationSchema.attest(api, userWallet, {
        huntId: parseInt(huntId || "0"),
        timestamp: Math.floor(Date.now() / 1000), // Current timestamp in seconds
        clueNumber: parseInt(clueId || "0"),
        numberOfTries: tries,
      });

      console.log("Attestation created:", output);
      await api.network.disconnect();
    } catch (error) {
      console.error("Failed to create attestation:", error);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) return;

    setIsSubmitting(true);
    setVerificationState("verifying");

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const isCorrect = true;

      if (isCorrect) {
        // Create attestation when clue is solved
        await createHuntAttestation(4 - attempts);

        setVerificationState("success");
        const nextClueId = currentClue + 1;
        if (currentClueData && nextClueId <= currentClueData.length) {
          navigate(`/hunt/${huntId}/clue/${nextClueId}`);
        } else {
          navigate("/");
        }
      } else {
        setVerificationState("error");
        setAttempts((prev) => prev - 1);
      }
    } catch (error) {
      console.error("Verification failed:", error);
      setVerificationState("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getButtonStyles = () => {
    if (!location) return "bg-gray-400 cursor-not-allowed";
    switch (verificationState) {
      case "verifying":
        return "bg-gray-800 hover:bg-gray-800";
      case "success":
        return "bg-green hover:bg-green/90";
      case "error":
        return "bg-red hover:bg-red";
      default:
        return "bg-black hover:bg-gray-800";
    }
  };

  const getButtonText = () => {
    if (!location) return "Waiting for location...";
    switch (verificationState) {
      case "verifying":
        return "Verifying location...";
      case "success":
        return "Location verified! Moving to next clue...";
      case "error":
        return `Wrong location - ${attempts} attempts remaining`;
      default:
        return "Verify Location";
    }
  };

  if (attempts === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="mb-6">
              <BsXCircle className="w-16 h-16 text-red-500 mx-auto" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              No More Attempts
            </h2>
            <p className="text-gray-600 mb-8">
              You've used all your attempts for this clue. Try another hunt or
              come back later.
            </p>
            <Button
              onClick={() => navigate("/")}
              className="bg-black hover:bg-gray-800 text-white px-8"
              size="lg"
            >
              <BsArrowLeft className="mr-2" />
              Return to Hunts
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 px-4 mb-[90px]">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8 border-2 border-black h-[calc(100vh-180px)] justify-between flex flex-col">
          <div className="bg-green p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Button
                onClick={() => navigate("/")}
                variant="ghost"
                className="text-white hover:bg-white/20"
              >
                <BsArrowLeft className="mr-2" />
                Back to Hunts
              </Button>
              <div className="text-2xl font-bold">
                # {currentClue}/{currentClueData?.length}
              </div>
            </div>

            <h1 className="text-xl font-bold mb-2">{huntData.title}</h1>
          </div>

          <div className="prose max-w-none p-6 h-full">
            <h1 className="text-xl font-semibold mb-2">Clue</h1>
            <ReactMarkdown className="text-lg">
              {currentClueData?.[currentClue - 1]?.riddle}
            </ReactMarkdown>
          </div>

          <div className="mt-8 border-t pt-6 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center text-gray-600">
                <BsGeoAlt className="mr-2" />
                {location ? "Location detected" : "Detecting location..."}
              </div>
              <div className="text-gray-600">
                Attempts remaining: {attempts}/3
              </div>
            </div>

            <form onSubmit={handleVerify}>
              <Button
                type="submit"
                size="lg"
                className={cn(
                  "w-full text-white transition-colors duration-300",
                  getButtonStyles()
                )}
                disabled={
                  !location ||
                  verificationState === "verifying" ||
                  verificationState === "success"
                }
              >
                {verificationState === "success" && (
                  <BsCheckCircle className="mr-2" />
                )}
                {verificationState === "error" && (
                  <BsXCircle className="mr-2" />
                )}
                {isSubmitting && (
                  <BsArrowRepeat className="mr-2 animate-spin" />
                )}
                {getButtonText()}
              </Button>
            </form>
          </div>
        </div>

        {huntId && <HuddleRoom huntId={huntId} />}
      </div>
    </div>
  );
}
