import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useReadContract, useActiveAccount } from "thirdweb/react";
import { getContract } from "thirdweb";
import { huntABI } from "../assets/hunt_abi";
import { useNetworkState } from "../lib/utils";
import { client } from "../lib/client";
import { Hunt, Team } from "../types";
import { validateClueAccess, getTeamIdentifier } from "../utils/progressUtils";
import { BsArrowRepeat } from "react-icons/bs";

// Type guard to ensure address is a valid hex string
function isValidHexAddress(address: string): address is `0x${string}` {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

interface RouteGuardProps {
  children: React.ReactNode;
}

export function RouteGuard({ children }: RouteGuardProps) {
  const { huntId, clueId } = useParams();
  const navigate = useNavigate();
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const account = useActiveAccount();
  const userWallet = account?.address;
  const { contractAddress, currentChain } = useNetworkState();

  // Create thirdweb contract instance
  const contract = getContract({
    client,
    chain: currentChain,
    address: contractAddress as `0x${string}`,
    abi: huntABI,
  });

  // Get hunt details from contract
  const { data: huntData } = useReadContract({
    contract,
    method: "getHunt",
    params: [BigInt(huntId || 0)],
  }) as { data: Hunt | undefined };

  // Fetch team data for validation
  const { data: teamData } = useReadContract({
    contract,
    method: "getTeam",
    params: [BigInt(huntId || 0), userWallet as `0x${string}`],
    queryOptions: { enabled: !!userWallet },
  }) as { data: Team | undefined };

  useEffect(() => {
    const validateAccess = async () => {
      // Reset state
      setIsValidating(true);
      setError(null);

      // Check if we have required data
      if (!huntId || !clueId || !userWallet || !contractAddress) {
        setError("Missing required data");
        setIsValidating(false);
        return;
      }

      if (!isValidHexAddress(contractAddress)) {
        setError("Invalid contract address");
        setIsValidating(false);
        return;
      }

      if (!huntData) {
        setError("Hunt data not available");
        setIsValidating(false);
        return;
      }

      try {
        // Get team identifier for progress checking
        const teamIdentifier = getTeamIdentifier(teamData, userWallet);
        
        // Get total clues from localStorage
        const currentClueData = JSON.parse(
          localStorage.getItem(`hunt_riddles_${huntId}`) || "[]"
        );
        const totalClues = currentClueData?.length || 0;

        // Validate clue access
        const canProceed = await validateClueAccess(
          parseInt(huntId),
          teamIdentifier,
          parseInt(clueId),
          navigate,
          totalClues
        );

        if (canProceed) {
          setIsValid(true);
        } else {
          // User was redirected, component will unmount
          return;
        }
      } catch (err) {
        console.error("Error validating clue access:", err);
        setError("Failed to validate access");
        // Allow access if validation fails to prevent blocking users
        setIsValid(true);
      } finally {
        setIsValidating(false);
      }
    };

    validateAccess();
  }, [huntId, clueId, userWallet, contractAddress, huntData, teamData, navigate]);

  // Show loading state while validating
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 px-4 mb-[90px]">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8 border-2 border-black min-h-[calc(100vh-180px)] justify-between flex flex-col">
            <div className="bg-green p-6 text-white">
              <div className="flex items-center justify-between my-4">
                <h1 className="text-xl font-bold flex-1 wrap-break-word">{huntData?.name || 'Hunt'}</h1>
                <div className="text-2xl font-bold shrink-0">
                  # {clueId}/{huntData?.clues_blobId ? '?' : '0'}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <BsArrowRepeat className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-600" />
                <p className="text-gray-600">Validating clue access...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if validation failed
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 px-4 mb-[90px]">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Access Error
            </h2>
            <p className="text-gray-600 mb-8">{error}</p>
            <button
              onClick={() => navigate("/")}
              className="bg-black hover:bg-gray-800 text-white px-8 py-2 rounded-sm"
            >
              Return to Hunts
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If validation passed, render the protected component
  if (isValid) {
    return <>{children}</>;
  }

  // Fallback (shouldn't reach here)
  return null;
}
