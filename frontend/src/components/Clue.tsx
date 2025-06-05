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

const BACKEND_URL = import.meta.env.VITE_PUBLIC_BACKEND_URL;

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
    localStorage.getItem(`hunt_riddles_${huntId}`) || "[]"
  );

  // Mock data - replace with API call
  const huntData = {
    title: "KhojNet Airdrop",
    description: "Bringing the best realworld experiences onchain!",
    totalClues: 10,
    currentClue: parseInt(clueId || "1"),
  };

  const createHuntAttestation = async () => {
    try {
      const api = await getTrueNetworkInstance();

      // TODO: Change to wallet address
      const userWallet = "0x9dfa242c8E10d16796174214797BC5b9893ab517";

      const output = await huntAttestationSchema.attest(api, userWallet, {
        huntId: parseInt(huntId || "0"),
        timestamp: Math.floor(Date.now() / 1000), // Current timestamp in seconds
        clueNumber: parseInt(clueId || "0"),
        numberOfTries: attempts,
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
    const userWallet = "0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97";
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
    if (!location) return;

    setIsSubmitting(true);
    setVerificationState("verifying");

    try {
      let headersList = {
        Accept: "*/*",
        "Content-Type": "application/json",
      };

      let bodyContent = JSON.stringify({
        userAddress: "0x7F23F30796F54a44a7A95d8f8c8Be1dB017C3397",

        lat_lang_blobId: "LnmXBTX2OBNljpi2isip18U21C4dwSKmDIbUnHSqJMY",
        cLat: location.latitude,
        cLong: location.longitude,
        clueId: Number(clueId),
      });

      let response = await fetch(`${BACKEND_URL}/decrypt-ans`, {
        method: "POST",
        body: bodyContent,
        headers: headersList,
      });

      let data = await response.json();
      console.log(data);

      const isCorrect = data.isClose;

      if (isCorrect == 'true') {
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
            const score = await getUserScore();
            localStorage.setItem("trust_score", score.toString());
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
