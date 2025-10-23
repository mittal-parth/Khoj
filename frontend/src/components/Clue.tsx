import { useParams, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "./ui/card";
import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import {
  BsArrowLeft,
  BsGeoAlt,
  BsCheckCircle,
  BsXCircle,
  BsArrowRepeat,
  BsBarChartFill,
  BsArrowClockwise,
} from "react-icons/bs";
import { HuddleRoom } from "./HuddleRoom";
import { Leaderboard } from "./Leaderboard";
import { useReadContract, useActiveAccount } from "thirdweb/react";
import { getContract } from "thirdweb";
import { huntABI } from "../assets/hunt_abi";
import { useNetworkState } from "../lib/utils";
import { toast } from "sonner";
import { client } from "../lib/client";
import { Hunt, Team } from "../types";
import { 
  syncProgressAndNavigate, 
  getTeamIdentifier,
  validateClueAccess,
  fetchProgress,
  isClueSolved
} from "../utils/progressUtils";

const BACKEND_URL = import.meta.env.VITE_PUBLIC_BACKEND_URL;
const MAX_ATTEMPTS = parseInt(import.meta.env.VITE_MAX_CLUE_ATTEMPTS || "6", 10);

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
  const [attempts, setAttempts] = useState(MAX_ATTEMPTS);
  const [verificationState, setVerificationState] = useState<
    "idle" | "verifying" | "success" | "error"
  >("idle");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

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

  const account = useActiveAccount();
  const userWallet = account?.address;

  // Fetch team data for attestation
  const { data: teamData } = useReadContract({
    contract,
    method: "getTeam",
    params: [BigInt(huntId || 0), userWallet as `0x${string}`],
    queryOptions: { enabled: !!userWallet },
  }) as { data: Team | undefined };

  // Track attempts for attestation
  const [attemptCount, setAttemptCount] = useState(0);

  // Get team identifier for progress checking
  const teamIdentifier = getTeamIdentifier(teamData, userWallet || "");

  const currentClue = parseInt(clueId || "0");
  const currentClueData = JSON.parse(
    localStorage.getItem(`hunt_riddles_${huntId}`) || "[]"
  );

  // Get total clues from localStorage
  const totalClues = currentClueData?.length || 0;

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

    // Clue access validation is now handled by RouteGuard at the router level
  }, [clueId, huntId, navigate, teamIdentifier]);

  if (!isValidHexAddress(contractAddress)) {
    toast.error("Invalid contract address format");
    return null;
  }


  const createAttestation = async () => {
    if (!userWallet || !huntId || !clueId) {
      console.log("Missing required data for attestation:", {
        userWallet: !!userWallet,
        huntId: !!huntId,
        clueId: !!clueId,
      });
      return;
    }

    try {
      const attestationData = {
        teamIdentifier: teamData?.teamId?.toString() || userWallet.toString(), // team id for teams, user wallet for solo users
        huntId: parseInt(huntId),
        clueIndex: parseInt(clueId),
        teamLeaderAddress: teamData?.owner || userWallet.toString(), // Use userWallet as fallback for solo users
        solverAddress: userWallet,
        attemptCount: attemptCount + 1, // +1 because this is the successful attempt
      };

      console.log("Creating attestation:", attestationData);

      const response = await fetch(`${BACKEND_URL}/attest-clue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(attestationData),
      });

      if (!response.ok) {
        throw new Error(`Attestation failed: ${response.status}`);
      }

      const result = await response.json();
      console.log("Attestation created successfully:", result);
      toast.success("Clue solve recorded!");
    } catch (error) {
      console.error("Failed to create attestation:", error);
      toast.error("Failed to record clue solve");
    }
  };

  // Sync progress with team
  const handleSyncProgress = async () => {
    if (!huntId || !teamIdentifier) {
      toast.error("Missing hunt or team information");
      return;
    }

    setIsSyncing(true);
    setIsRedirecting(true);
    try {
      const currentClueIndex = parseInt(clueId || "0");
      await syncProgressAndNavigate(
        parseInt(huntId),
        teamIdentifier,
        currentClueIndex,
        navigate,
        totalClues
      );
    } catch (error) {
      console.error("Error syncing progress:", error);
      toast.error("Failed to sync progress");
      setIsRedirecting(false);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    console.log("handleVerify called");
    e.preventDefault();
    if (!location) {
      console.log("location is null");
      return;
    } else {
      console.log("location is not null ", location);
    }
    if (!huntData) {
      console.log("huntData is null");
      return;
    }

    // Re-validate clue access before verification to handle real-time changes
    if (huntId && teamIdentifier) {
      console.log("Re-validating clue access before verification...", { huntId, teamIdentifier, clueId, totalClues });
      setIsRedirecting(true);
      const canProceed = await validateClueAccess(
        parseInt(huntId),
        teamIdentifier,
        parseInt(clueId || "0"),
        navigate,
        totalClues
      );
      console.log("Clue access re-validation result:", canProceed);
      if (!canProceed) {
        console.log("Clue access denied during verification, returning early");
        return; // User was redirected, don't proceed with verification
      }
      setIsRedirecting(false);
    }

    // Check if clue is already solved by the team before making any backend calls
    try {
      const progressData = await fetchProgress(
        parseInt(huntId || "0"),
        teamIdentifier,
        totalClues
      );
      
      if (progressData) {
        const clueIndex = parseInt(clueId || "0");
        
        if (isClueSolved(progressData, clueIndex)) {
          console.log("Clue already solved by team, skipping verification");
          toast.info("This clue has already been solved by your team!");
          setVerificationState("success");
          setShowSuccessMessage(true);
          
          // Navigate to next clue since it's solved
          setTimeout(async () => {
            const nextClueId = currentClue + 1;
            if (currentClueData && nextClueId <= currentClueData.length) {
              navigate(`/hunt/${huntId}/clue/${nextClueId}`);
            } else {
              navigate(`/hunt/${huntId}/end`);
            }
          }, 500);
          return;
        }
      }
    } catch (error) {
      console.error("Error checking if clue is already solved:", error);
      // Continue with normal flow if check fails
    }

    setIsSubmitting(true);
    setVerificationState("verifying");
    console.log("huntData: ", huntData);
    console.log("=== DEBUGGING REQUEST ===");
    console.log("Current location state:", location);
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
      console.log("data.isClose:", data.isClose);

      const isCorrect = data.isClose;

      if (isCorrect == "true") {
        // Increment attempt count for attestation
        setAttemptCount(prev => prev + 1);
        
        // Create attestation when clue is solved
        await createAttestation();

        setVerificationState("success");
        setShowSuccessMessage(true);

        console.log("Success"), showSuccessMessage;

        // Wait 0.5 seconds before navigating
        setTimeout(async () => {
          const nextClueId = currentClue + 1;
          if (currentClueData && nextClueId <= currentClueData.length) {
            navigate(`/hunt/${huntId}/clue/${nextClueId}`);
          } else {
            // He has completed all clues
            navigate(`/hunt/${huntId}/end`);
          }
        }, 500);
      } else {
        setVerificationState("error");
        setAttempts((prev) => prev - 1);
        setAttemptCount(prev => prev + 1); // Increment attempt count even for failed attempts
      }
    } catch (error) {
      console.error("Verification failed:", error);
      setVerificationState("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getButtonVariant = () => {
    if (!location) return "neutral";
    switch (verificationState) {
      case "verifying":
        return "neutral";
      case "success":
        return "default";
      case "error":
        return "default";
      default:
        return "default";
    }
  };

  const getButtonStyles = () => {
    if (!location) return "opacity-50 cursor-not-allowed";
    switch (verificationState) {
      case "verifying":
        return "opacity-75";
      case "success":
        return "bg-green-500 hover:bg-green-600 text-white";
      case "error":
        return "bg-red-500 hover:bg-red-600 text-white";
      default:
        return "";
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
      <div className="min-h-screen bg-background pt-20 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="text-center">
            <CardContent className="p-8">
              <div className="mb-6">
                <BsXCircle className="w-16 h-16 text-red-500 mx-auto" />
              </div>
              <CardTitle className="text-3xl mb-4">
                No More Attempts
              </CardTitle>
              <p className="text-foreground/70 mb-8">
                You've used all your attempts for this clue. Try another hunt or
                come back later.
              </p>
              <Button
                onClick={() => navigate("/")}
                variant="default"
                size="lg"
                className="px-8"
              >
                <BsArrowLeft className="mr-2" />
                Return to Hunts
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 px-4 mb-[90px]">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-8 min-h-[calc(100vh-180px)] flex flex-col bg-white">
          <CardHeader className="bg-main text-main-foreground p-6 -my-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex-1 wrap-break-word">{huntData?.name}</CardTitle>
              <div className="flex items-center space-x-4">
                <div className="text-2xl shrink-0">
                  # {currentClue}/{currentClueData?.length}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={handleSyncProgress}
                    disabled={isSyncing}
                    variant="neutral"
                    size="sm"
                    className="p-2"
                    title="Sync with team progress"
                  >
                    <BsArrowClockwise className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button
                    onClick={() => setIsLeaderboardOpen(true)}
                    variant="neutral"
                    size="sm"
                    className="p-2"
                  >
                    <BsBarChartFill className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="prose max-w-none p-6 h-full flex-1 flex flex-col justify-center">
            <h1 className="text-xl font-semibold mb-2">Clue</h1>
            {isRedirecting ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <BsArrowRepeat className="w-8 h-8 animate-spin mx-auto mb-2 text-foreground/60" />
                  <p className="text-foreground/60">Syncing progress...</p>
                </div>
              </div>
            ) : (
              <ReactMarkdown className="text-lg">
                {currentClueData?.[currentClue - 1]?.riddle}
              </ReactMarkdown>
            )}
          </CardContent>

          <CardFooter className="border-t pt-6 flex flex-col">
            <div className="flex items-center justify-between mb-4 text-sm gap-4">
              <div className="flex items-center text-foreground/70">
                <BsGeoAlt className="mr-1" />
                {location ? "Location detected" : "Detecting location..."}
              </div>
              <div className="text-foreground/70">
                Attempts remaining: {attempts}/{MAX_ATTEMPTS}
              </div>
            </div>

            <form onSubmit={handleVerify} className="w-full">
              <Button
                type="submit"
                variant={getButtonVariant()}
                size="lg"
                className={cn(
                  "w-full transition-colors duration-300",
                  getButtonStyles()
                )}
                disabled={
                  !location ||
                  verificationState === "verifying" ||
                  verificationState === "success" ||
                  isRedirecting
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
          </CardFooter>
        </Card>

        {huntId && <HuddleRoom huntId={huntId} teamIdentifier={teamIdentifier} />}
        
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
