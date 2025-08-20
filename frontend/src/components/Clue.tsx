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
import { config, getTrueNetworkInstance } from "../../true-network/true.config";
import { huntAttestationSchema } from "@/schemas/huntSchema";
import { runAlgo } from "@truenetworkio/sdk/dist/pallets/algorithms/extrinsic";
import { HuddleRoom } from "./HuddleRoom";
import { useReadContract, useActiveAccount } from "thirdweb/react";
import { getContract } from "thirdweb";
import { huntABI } from "../assets/hunt_abi";
import { CONTRACT_ADDRESSES } from "../lib/utils";
import { toast } from "sonner";
import { client } from "../lib/client";
import { paseoAssetHub } from "../lib/chains";

const BACKEND_URL = import.meta.env.VITE_PUBLIC_BACKEND_URL;

// Type guard to ensure address is a valid hex string
function isValidHexAddress(address: string): address is `0x${string}` {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

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
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Add this to get current network from localStorage
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

  const account = useActiveAccount();
  const userWallet = account?.address;

  useEffect(() => {
    setVerificationState("idle");

    // Progress validation: prevent skipping ahead
    const progressKey = `hunt_progress_${huntId}`;
    let progress = JSON.parse(localStorage.getItem(progressKey) || "[]");
    // Only allow access to the next unsolved clue or any previous clue
    const allowedClue = (progress.length || 0) + 1;
    if (currentClue > allowedClue) {
      navigate(`/hunt/${huntId}/clue/${allowedClue}`);
      return;
    }

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

    // Initialize or restore per-clue timer start
    const clueTimerKey = `hunt_${huntId}_clue_${clueId}_start`;
    const storedStart = localStorage.getItem(clueTimerKey);
    const startTimestamp = storedStart ? Number(storedStart) : Date.now();
    if (!storedStart) {
      localStorage.setItem(clueTimerKey, String(startTimestamp));
    }

    // Compute per-clue duration from hunt duration if available
    const totalDurationSeconds = huntDetails ? Number(huntDetails[3] ?? 0) : 0;
    const riddles = JSON.parse(
      localStorage.getItem(`hunt_riddles_${huntId}`) || "[]"
    );
    const totalClues = Array.isArray(riddles) ? riddles.length : 0;
    const perClueDuration = totalClues > 0 && totalDurationSeconds > 0
      ? Math.max(1, Math.floor(totalDurationSeconds / totalClues))
      : 0;

    // Tick every second
    const tick = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTimestamp) / 1000);
      setElapsedSeconds(elapsed);
      if (perClueDuration > 0) {
        setTimeLeft(Math.max(0, perClueDuration - elapsed));
      } else {
        setTimeLeft(null);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [clueId, huntId, navigate]);

  if (!isValidHexAddress(contractAddress)) {
    toast.error("Invalid contract address format");
    return null;
  }

  const currentClue = parseInt(clueId || "0");
  const currentClueData = JSON.parse(
    localStorage.getItem(`hunt_riddles_${huntId}`) || "[]"
  );

  // Extract hunt details
  const huntData = huntDetails
    ? {
        title: huntDetails[0],
        description: huntDetails[1],
        totalClues: currentClueData?.length || 0,
        currentClue: parseInt(clueId || "1"),
        answers_blobId: huntDetails[7],
      }
    : null;

  const createHuntAttestation = async () => {
    try {
      const api = await getTrueNetworkInstance();
      if (!userWallet) {
        toast.error("Wallet not connected");
        setIsSubmitting(false);
        return;
      }
      const output = await huntAttestationSchema.attest(api, userWallet, {
        huntId: parseInt(huntId || "0"),
        timestamp: Math.floor(Date.now() / 1000), // Current timestamp in seconds
        clueNumber: parseInt(clueId || "0"),
        numberOfTries: attempts,
        timeTaken: elapsedSeconds,
      });
      console.log("Attestation created:", output);
      await api.network.disconnect();
    } catch (error) {
      setIsSubmitting(false);
      console.error("Failed to create attestation:", error);
    }
  };

  const getUserScore = async () => {
    const api = await getTrueNetworkInstance();
    if (!userWallet) {
      throw new Error("Wallet not connected");
    }
    const score = await runAlgo(
      api.network,
      config.issuer.hash,
      api.account,
      userWallet,
      config.algorithm?.id ?? 0
    );
    return score;
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location || !huntData) return;

    setIsSubmitting(true);
    setVerificationState("verifying");
    console.log("huntData: ", huntDetails);
    console.log("=== DEBUGGING REQUEST ===");
    console.log("Current location state:", location);
    console.log("Location type:", typeof location);
    console.log("Location keys:", Object.keys(location));
    console.log("huntData:", huntData);
    console.log("huntData.answers_blobId:", huntData.answers_blobId);
    console.log("clueId param:", clueId);
    console.log("Number(clueId):", Number(clueId));

    try {
      const headersList = {
        Accept: "*/*",
        "Content-Type": "application/json",
      };

      const requestBody = {
        userAddress: "0x7F23F30796F54a44a7A95d8f8c8Be1dB017C3397",
        answers_blobId: huntData.answers_blobId,
        cLat: location.latitude,
        cLong: location.longitude,
        clueId: Number(clueId),
      };

      console.log("Request body object:", requestBody);
      console.log("Request body object keys:", Object.keys(requestBody));

      const bodyContent = JSON.stringify(requestBody);
      console.log("Stringified body content:", bodyContent);

      const response = await fetch(`${BACKEND_URL}/decrypt-ans`, {
        method: "POST",
        body: bodyContent,
        headers: headersList,
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      const data = await response.json();
      console.log("=== BACKEND RESPONSE ===");
      console.log("Full response data:", data);
      console.log("Response data type:", typeof data);
      console.log("Response data keys:", Object.keys(data));
      console.log("data.isClose:", data.isClose);
      console.log("data.isClose type:", typeof data.isClose);

      const isCorrect = data.isClose;

      if (isCorrect == "true") {
        // Update progress in localStorage
        const progressKey = `hunt_progress_${huntId}`;
        let progress = JSON.parse(localStorage.getItem(progressKey) || "[]");
        if (!progress.includes(currentClue)) {
          progress.push(currentClue);
          localStorage.setItem(progressKey, JSON.stringify(progress));
        }
        // Create attestation when clue is solved
        await createHuntAttestation();

        setVerificationState("success");
        setShowSuccessMessage(true);

        console.log("Success"), showSuccessMessage;

        // Wait 2 seconds before navigating
        setTimeout(async () => {
          const nextClueId = currentClue + 1;
          if (currentClueData && nextClueId <= currentClueData.length) {
            navigate(`/hunt/${huntId}/clue/${nextClueId}`);
          } else {
            // He has completed all clues
            try {
              const score = await getUserScore();
              localStorage.setItem("trust_score", score.toString());
            } catch (error) {
              console.error("Failed to get user score:", error);
            }
            navigate(`/hunt/${huntId}/end`);
          }
        }, 2000);
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
        return "Correct Answer!";
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
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8 border-2 border-black min-h-[calc(100vh-180px)] md:h-[calc(100vh-180px)] justify-between flex flex-col">
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
              {timeLeft !== null && (
                <div className="text-xl font-mono">
                  {`${String(Math.floor(timeLeft / 60)).padStart(2, "0")}:${String(timeLeft % 60).padStart(2, "0")}`}
                </div>
              )}
            </div>

            <h1 className="text-xl font-bold mb-2">{huntData?.title}</h1>
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
                  verificationState === "success" ||
                  (timeLeft !== null && timeLeft <= 0)
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
