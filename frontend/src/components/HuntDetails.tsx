import { useParams, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Loader } from "./ui/loader";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  BsQrCode,
  BsExclamationTriangle,
  BsLink45Deg,
  BsCalendar2DateFill,
} from "react-icons/bs";
import { TbUsersGroup } from "react-icons/tb";
import { IoIosPeople } from "react-icons/io";
import { HuddleRoom } from "./HuddleRoom";
import { useReadContract, useActiveAccount, useSendTransaction } from "thirdweb/react";
import { getContract, prepareContractCall, readContract } from "thirdweb";
import { useNetworkState } from "../lib/utils";
import { toast } from "sonner";
import { client } from "../lib/client";
import QRCode from "react-qr-code";
import QrScanner from "qr-scanner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { generateInviteHash, encodeInviteToBase58, calculateInviteExpiry, decodeBase58Invite, signMessageWithEIP191 } from "../utils/inviteUtils.ts";
import { extractTeamIdFromTransactionLogs } from "../utils/transactionUtils.ts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { huntABI } from "../assets/hunt_abi.ts";
import { useGenerateRiddles } from "@/hooks/useGenerateRiddles.ts";
import { Hunt, Team } from "../types";
import { buttonStyles } from "../lib/styles.ts";
import { withRetry, MAX_RETRIES } from "@/utils/retryUtils";
import { FiRefreshCw } from "react-icons/fi";
import { BsBarChartFill } from "react-icons/bs";
import { Leaderboard } from "./Leaderboard";

const BACKEND_URL = import.meta.env.VITE_PUBLIC_BACKEND_URL;

// Type guard to ensure address is a valid hex string
function isValidHexAddress(address: string): address is `0x${string}` {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

export function HuntDetails() {
  const { huntId } = useParams();
  const navigate = useNavigate();
  
  // Team management state
  const [joinTeamCode, setJoinTeamCode] = useState<string>(""); // For joining existing teams
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");
  const [hasCamera, setHasCamera] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  
  // Multi-use invite state
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);
  const [showInviteWarning, setShowInviteWarning] = useState(false);
  
  // Join team loading state
  const [isJoiningTeam, setIsJoiningTeam] = useState(false);
  
  // Leaderboard state
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  // Team name input
  const [teamName, setTeamName] = useState<string>("");
  
  
  // Video reference for QR scanner
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // QR scanner instance
  const [qrScanner, setQrScanner] = useState<QrScanner | null>(null);

  const account = useActiveAccount();
  const userWallet = account?.address;
  const { mutate: sendTransaction } = useSendTransaction();
  
  // Add useGenerateRiddles hook
  const { fetchRiddles, isLoading: isGeneratingRiddles } = useGenerateRiddles(Number(huntId));
  
  // Local loading state for immediate button feedback
  const [isStartingHunt, setIsStartingHunt] = useState(false);
  
  // Retry state for decrypt-clues API call
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // Use the reactive network state hook
  const { currentNetwork, contractAddress, chainId, currentChain } = useNetworkState();

  if (!isValidHexAddress(contractAddress)) {
    toast.error("Invalid contract address format");
    return null;
  }

  const contract = getContract({
    client,
    chain: currentChain,
    address: contractAddress as `0x${string}`,
    abi: huntABI,
  });

  // Get hunt details from contract - now returns HuntInfo struct directly
  const { data: huntData, isLoading: huntLoading } = useReadContract({
    contract,
    method: "getHunt",
    params: [BigInt(huntId || 0)],
  }) as { data: Hunt | undefined; isLoading: boolean };

  const { data: teamData, error: teamError, refetch: refetchTeamData, isLoading: teamDataLoading } = useReadContract({
    contract,
    method: "getTeam",
    params: [BigInt(huntId || 0), userWallet as `0x${string}`],
    queryOptions: { enabled: !!userWallet }, // Only call when userWallet is available
  }) as { data: Team | undefined; error: Error | undefined; refetch: () => void; isLoading: boolean };

  const joinTeam = async (signature: string, teamId: string, expiry: number) => {
    setIsJoiningTeam(true);
    try {
      console.log("[joinWithInvite] invoked", {
        teamId,
        expiry,
        signature,
        now: Math.floor(Date.now() / 1000),
        currentNetwork,
        contractAddress,
        userWallet,
      });

      if (!signature || !teamId || !expiry) {
        console.warn("[joinWithInvite] Missing required params", { signaturePresent: !!signature, teamId, expiry });
      }

      if (!/^0x[0-9a-fA-F]+$/.test(signature)) {
        console.warn("[joinWithInvite] Signature may be malformed (expected 0x-hex)", signature);
      }

      if (Number.isNaN(Number(teamId))) {
        console.warn("[joinWithInvite] teamId is not a number", teamId);
      }

      const nowSeconds = Math.floor(Date.now() / 1000);
      console.log("[joinWithInvite] Expiry delta (s)", expiry - nowSeconds);

      console.log("[joinWithInvite] Preparing transaction...");
      const transaction = prepareContractCall({
      contract: {
        address: contractAddress as `0x${string}`,
        abi: huntABI,
        chain: currentChain,
        client,
      },
      method: "joinWithInvite",
      params: [BigInt(teamId || 0), BigInt(expiry), signature as `0x${string}`],
      });

      console.log("[joinWithInvite] Transaction prepared", {
        to: contractAddress,
        method: "joinWithInvite",
        params: [teamId?.toString(), expiry?.toString(), `${signature?.slice(0, 10)}...`],
      });

      // Execute the transaction and get the result
      console.log("[joinWithInvite] Sending transaction...");
      sendTransaction(transaction as any, {
        onSuccess: (result) => {
          console.log("[joinWithInvite] Transaction success", {
            txHash: (result as any)?.transactionHash,
            result,
          });
          toast.success("Team joined successfully!");
          // Refetch team data to show updated team info
          refetchTeamData();
          setIsJoiningTeam(false);
        },
        onError: (error) => {
          const anyErr = error as any;
          console.error("[joinWithInvite] Transaction failed", error);
          if (anyErr?.reason) console.error("[joinWithInvite] reason:", anyErr.reason);
          if (anyErr?.data?.message) console.error("[joinWithInvite] data.message:", anyErr.data.message);
          if (anyErr?.shortMessage) console.error("[joinWithInvite] shortMessage:", anyErr.shortMessage);
          toast.error("Failed to join team");
          setIsJoiningTeam(false);
        }
      });
    } catch (err) {
      console.error("[joinWithInvite] Unexpected error before send", err);
      toast.error("Failed to prepare join transaction");
      setIsJoiningTeam(false);
    }
  }

  const handleHuntStart = async () => {
    setIsStartingHunt(true);
    setRetryCount(0);
    setIsRetrying(false);
    
    if (!userWallet) {
      toast.error("Please connect your wallet first");
      setIsStartingHunt(false);
      return;
    }

    if (!huntData?.clues_blobId || !huntData?.answers_blobId) {
      toast.error("Hunt data not available");
      setIsStartingHunt(false);
      return;
    }

    // Check if user is registered by looking at the participants array
    const isRegistered = huntData?.participants?.includes(userWallet) ?? false;

    if (!isRegistered) {
      toast.error(
        "You are not eligible for this hunt. Please register or check the requirements."
      );
      setIsStartingHunt(false);
      return;
    }

    const decryptCluesOperation = async (): Promise<void> => {
      console.log("Hunt ID:", huntId, huntData.clues_blobId, huntData.answers_blobId);
      
      const headersList = {
        Accept: "*/*",
        "Content-Type": "application/json",
      };

      const bodyContent = JSON.stringify({
        userAddress: userWallet,
        clues_blobId: huntData.clues_blobId,
        answers_blobId: huntData.answers_blobId,
      });

      const response = await fetch(`${BACKEND_URL}/decrypt-clues`, {
        method: "POST",
        body: bodyContent,
        headers: headersList,
      });

      if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(`HTTP ${response.status}: ${errorText}`);
        (error as any).status = response.status;
        throw error;
      }

      const data = await response.text();
      const clues = JSON.parse(data);

      console.log("Clues: ", clues);

      await fetchRiddles(clues, huntId || "0", huntData?.theme || "");
      navigate(`/hunt/${huntId}/clue/1`);
    };

    try {
      await withRetry(decryptCluesOperation, {
        onRetry: (attempt, error) => {
          console.error(`Decrypt Clues Error (attempt ${attempt}):`, error);
          setIsRetrying(true);
          setRetryCount(attempt);
        }
      });
      
      // Reset retry state on success
      setRetryCount(0);
      setIsRetrying(false);
    } catch (error) {
      console.error("Error starting hunt:", error);
      toast.error("Failed to start hunt");
    } finally {
      setIsStartingHunt(false);
      setIsRetrying(false);
    }
  };
  
  // Function to start the QR scanner
  const startScanner = async () => {
    if (!videoRef.current) return;
    
    try {
      // Check if camera is available
      await navigator.mediaDevices.getUserMedia({ video: true });
      setHasCamera(true);
      
      // Create new QR scanner instance
      const scanner = new QrScanner(
        videoRef.current,
        (result) => {
          // Handle successful scan
          const scannedCode = result.data;
          if (scannedCode && scannedCode.trim() !== '') {
            const inviteData = decodeBase58Invite(scannedCode);
            setScanResult(scannedCode);
            setJoinTeamCode(scannedCode);
            scanner.stop();
            setHasCamera(false); // Hide camera after successful scan
            toast.success("QR code scanned successfully!");

            // Join team asynchronously
            joinTeam(inviteData.signature, inviteData.teamId, inviteData.expiry).then(() => {
              // Additional refetch after successful QR join
              setTimeout(() => refetchTeamData(), 1000);
            }).catch(error => {
              console.error("Error joining team:", error);
              toast.error("Failed to join team");
            });

          } else {
            toast.error("Invalid QR code detected. Please try again.");
          }
        },
        { 
          highlightScanRegion: true,
          highlightCodeOutline: true,
          returnDetailedScanResult: true
        }
      );
      
      // Add error handler
      scanner.setInversionMode('both');
      
      // Start scanning
      await scanner.start();
      setQrScanner(scanner);
      
      // Set a timeout to stop scanning after 30 seconds if no code is detected
      setTimeout(() => {
        if (hasCamera && qrScanner === scanner) {
          toast.info("No QR code detected. You can try again or enter the code manually.");
          scanner.stop();
          setHasCamera(false);
        }
      }, 30000);
      
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Could not access camera. Please check permissions.');
    }
  };
  
  // Clean up scanner when component unmounts
  useEffect(() => {
    return () => {
      if (qrScanner) {
        qrScanner.stop();
      }
    };
  }, [qrScanner]);

  // Log team error to understand why it's undefined
  if (teamError) {
    console.log("Team error:", teamError.message);
  }
  
  // Check if user is already in a team
  const isUserInTeam = teamData && teamData.members && teamData.members.includes(userWallet as `0x${string}`);
  
  // Reset join team code when switching tabs
  useEffect(() => {
    if (activeTab === 'join') {
      setJoinTeamCode("");
      setScanResult(null);
    }
  }, [activeTab]);
  

  // Monitor teamData changes for debugging
  useEffect(() => {
    console.log("🔄 teamData changed:", teamData);
    console.log("Account:", account);
    console.log("User Wallet:", userWallet);
    console.log("Team Error:", teamError?.message);
  }, [teamData, account, userWallet, teamError]);

  // Show loading state while hunt data is being fetched
  if (huntLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 px-4 mb-[90px]">
        <div className="max-w-4xl mx-auto">
          <Loader 
            text="Loading Hunt Details..." 
            subtext="Fetching hunt information and team data..."
            showAnimation={true}
          />
        </div>
      </div>
    );
  }

  // Generate multi-use invite code
  const generateMultiUseInvite = async () => {
    console.log("🚀 Starting generateMultiUseInvite");
    console.log("Account:", account?.address);
    console.log("HuntId:", huntId);
    
    if (!account || !huntData) {
      console.log("❌ Missing account or huntData");
      toast.error("Please connect your wallet first");
      return;
    }
    
    
    try {
      setIsGeneratingInvite(true);
      const transaction = prepareContractCall({
        contract: {
          address: contractAddress as `0x${string}`,
          abi: huntABI,
          chain: currentChain,
          client,
        },
        method: "createTeam",
        params: [BigInt(huntId || 0), teamName],
      });

      console.log("📤 Sending transaction...");
      // Execute the transaction and get the result
      sendTransaction(transaction as any, {
        onSuccess: async (result) => {
          console.log("✅ Transaction successful!:", result.transactionHash);
          toast.success("Team created successfully!");
          
          // Refetch team data immediately
          refetchTeamData();
          
          try {
            console.log("⏳ Extracting teamId from transaction logs...");
            const waitToastId = toast.loading("Getting transaction receipt and doing the magic...");
            
            // Extract teamId from transaction logs
            const teamId = await extractTeamIdFromTransactionLogs(
              result.transactionHash,
              contractAddress,
              currentChain
            );

            // Success! We have the teamId from the logs
            toast.success("Generating invite...", { id: waitToastId });
            await generateInviteAfterTeamCreation(teamId);
            // Refetch again after invite generation
            refetchTeamData();
            
          } catch (error) {
            console.error("❌ Error extracting teamId from transaction logs:", error);
            console.log("⚠️ Falling back to getParticipantTeamId method...");
            
            // Fallback to the original method if parsing logs fails
            try {
              const waitToastId = toast.loading("Its taking longer than expected...");
              
              const getTeamIdOperation = async (): Promise<string> => {
                console.log("🔍 Getting teamId from getParticipantTeamId...");
                const teamId = await readContract({
                  contract,
                  method: "getParticipantTeamId",
                  params: [BigInt(huntId || 0), userWallet as `0x${string}`],
                });
                console.log("TeamId from getParticipantTeamId:", teamId);
                
                if (teamId && teamId.toString() !== "0") {
                  console.log("✅ Found teamId:", teamId.toString());
                  return teamId.toString();
                } else {
                  throw new Error("temporarily unavailable: teamId not found yet - transaction may not be mined");
                }
              };

              const teamId = await withRetry(getTeamIdOperation, {
                maxRetries: MAX_RETRIES,
                initialDelay: 2000,
                onRetry: (attempt, error) => {
                  console.log(`❌ No teamId found yet, retrying... (attempt ${attempt}/${MAX_RETRIES})`);
                  console.error("Retry due to error:", error.message);
                  toast.loading(`Still waiting for confirmation... (attempt ${attempt + 1}/${MAX_RETRIES})`, { id: waitToastId });
                }
              });

              toast.success("Confirmed on-chain. Generating invite...", { id: waitToastId });
              await generateInviteAfterTeamCreation(teamId);
              refetchTeamData();
              
            } catch (fallbackError) {
              console.error("❌ Fallback method also failed:", fallbackError);
              toast.error("Team created but could not generate invite. Please try again.", { id: undefined });
              setIsGeneratingInvite(false);
            }
          }
        },
        onError: (error) => {
          console.error("❌ Transaction failed:", error);
          toast.error("Failed to create team");
          setIsGeneratingInvite(false);
        }
      });

    } catch (error) {
      console.error("❌ Error preparing transaction:", error);
      toast.error("Failed to prepare transaction");
      setIsGeneratingInvite(false);
    }
  };

  // Separate function to handle invite generation after team creation
  const generateInviteAfterTeamCreation = async (teamId: string) => {
    console.log("🎯 Starting generateInviteAfterTeamCreation");
    
    if (!account || !huntData || !teamId) {
      console.log("❌ Missing required data for invite generation");
      console.log("Account present:", !!account);
      console.log("HuntData present:", !!huntData);
      console.log("TeamId present:", !!teamId);
      toast.error("Missing required data for invite generation");
      setIsGeneratingInvite(false);
      return;
    }

    try {
      // Calculate expiry time (current time + 1 hour)
      const expiryTime = calculateInviteExpiry();
      console.log("Expiry date (UTC):", new Date(expiryTime * 1000).toISOString());
      console.log("🔐 Generating invite hash...");
      
      // Generate invite hash
      const hash = generateInviteHash(
        teamId,
        expiryTime,
        chainId,
        contractAddress
      );
      
      console.log("Generated hash:", hash);
      
      console.log("✍️ Signing hash with wallet using EIP-191...");
      // Sign the hash with EIP-191 prefix for contract verification
      const signature = await signMessageWithEIP191(hash, account);
      
      console.log("Signature received:", signature);
      console.log("📦 Encoding invite data...");
      // Encode the invite data
      const encodedInvite = encodeInviteToBase58(
        teamId,
        expiryTime,
        signature
      );
      
      console.log("Encoded invite:", encodedInvite);
  
      setInviteCode(encodedInvite);
      setShowInviteWarning(true);
      
      console.log("✅ Invite generation completed successfully!");
      
    } catch (error) {
      console.error("❌ Error generating invite:", error);
      console.error("Error details:", error);
      toast.error("Failed to generate invite code");
    } finally {
      console.log("🔄 Setting isGeneratingInvite to false");
      setIsGeneratingInvite(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 px-4 mb-[90px]">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8 border-2 border-black min-h-[calc(100vh-180px)] justify-between relative flex flex-col">
        <div>
          <div className="bg-green p-6 text-white">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-white">
                {huntData?.name || 'Hunt Details'}
              </h1>
              <Button
                onClick={() => setIsLeaderboardOpen(true)}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 p-2"
                size="sm"
              >
                <BsBarChartFill className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {huntData && (
            <div className="px-6">
              <p className="text-gray-600 font-base my-6">{huntData.description}</p>
              
              {/* Hunt Details Section */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Date and Time */}
                  <div className="flex items-center gap-2">
                    <BsCalendar2DateFill className="w-6 h-6 text-green" />
                    <div>
                      <p className="text-sm text-gray-600">Date & Time</p>
                      <p className="text-sm font-medium text-gray-800">
                        {new Date(Number(huntData.startTime) * 1000).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {new Date(Number(huntData.startTime) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(Number(huntData.endTime) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  
                  {/* Participants */}
                  <div className="flex items-center gap-2">
                    <IoIosPeople className="w-6 h-6 text-green" />
                    <div>
                      <p className="text-sm text-gray-600">Participants</p>
                      <p className="text-sm font-medium text-gray-800">
                        {Number(huntData.participantCount)} registered
                      </p>
                    </div>
                  </div>
                  
                  {/* Teams Status */}
                  <div className="flex items-center gap-2">
                    <TbUsersGroup className="w-6 h-6 text-green" />
                    <div>
                      <p className="text-sm text-gray-600">Teams</p>
                      <p className="text-sm font-medium text-gray-800">
                        {huntData?.teamsEnabled ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                  </div>
                </div>
                </div> 
              
              {/* Team Management Section - Only show if teams are enabled */}
              {huntData?.teamsEnabled && (
              <div className="mt-6">
                {/* Show team info if user is already in a team */}
                {isUserInTeam ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium">Team Management</h2>
                    <span className="flex items-center gap-2">
                      <span onClick={refetchTeamData} className={`cursor-pointer bg-green p-1 rounded-lg text-white h-6 w-6 content-center`}><FiRefreshCw className={teamDataLoading ? 'animate-spin m-auto' : 'm-auto'} /></span>
                      <span onClick={refetchTeamData} className="cursor-pointer bg-gray-50 hover:bg-gray-200 border border-gray-200 p-1 px-4 rounded-lg hidden sm:block">Refresh</span>
                    </span>
                  </div>
                    <div className="border-t-2 border-gray-200 pt-4">
                      <h3 className="text-lg font-semibold mb-1">Your Team</h3>
                      {teamData?.name && (
                        <div className="text-sm text-gray-700 mb-3">
                          <span className="font-medium">Name:</span> {teamData.name}
                        </div>
                      )}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Members:</span>
                          <span className="font-medium">{teamData?.memberCount?.toString() || '0'}/{teamData?.maxMembers?.toString() || '0'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Team Owner:</span>
                          <span className="font-medium text-sm">{teamData?.owner ? `${teamData.owner.slice(0, 6)}...${teamData.owner.slice(-4)}` : 'Unknown'}</span>
                        </div>
                        <div className="mt-4">
                          <span className="text-gray-600 block mb-2">Team Members:</span>
                          <div className="flex gap-3 flex-wrap">
                            {(teamData?.members || []).map((member, index) => (
                              <div key={index} className="flex flex-col items-center gap-3">
                                <img 
                                  src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${member}`}
                                  alt="Member Avatar"
                                  className={`w-12 h-12 rounded-full p-1 bg-slate-200 ${member === teamData?.owner ? "border-2 border-slate-800" : ""}`}
                                />
                                <div className="flex-1">
                                  <span className="text-xs font-medium text-gray-500">
                                    {member ? `${member.slice(0, 4)}...${member.slice(-4)}` : 'Unknown Member'}
                                  </span>
                                </div>
                              </div>
                            ))}
                            {(!teamData?.members || teamData.members.length === 0) && (
                              <div className="text-sm text-gray-500 italic">No members found</div>
                            )}
                          </div>
                        </div>
                        
                        {/* Show invite QR code if user is the team owner and has generated one */}
                        {teamData?.owner === userWallet && inviteCode && (
                          <div className="mt-6 border-t pt-4">
                            <h4 className="text-md font-medium mb-3">Team Invite Code</h4>
                            <div className="flex flex-col items-center space-y-4">
                              <div className="bg-white p-4 rounded-lg border">
                                <QRCode value={inviteCode} size={150} />
                              </div>
                              <div className="flex items-center space-x-2 w-full max-w-md">
                                <input
                                  type="text"
                                  value={inviteCode}
                                  readOnly
                                  className="flex-1 p-2 border rounded bg-gray-50 text-xs"
                                />
                                <Button 
                                  onClick={() => {
                                    navigator.clipboard.writeText(inviteCode);
                                    toast.success("Invite code copied to clipboard");
                                  }}
                                  className="flex items-center space-x-1"
                                  size="sm"
                                >
                                  <BsLink45Deg />
                                  <span>Copy</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  // Show create/join options when user is not in a team
                  <Tabs defaultValue="create" onValueChange={(value) => setActiveTab(value as "create" | "join")}>
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="create">Create Team</TabsTrigger>
                      <TabsTrigger value="join">Join Team</TabsTrigger>
                    </TabsList>
                  
                    {/* Create Team Tab */}
                    <TabsContent value="create" className="mt-4">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        {!inviteCode ? (
                          <div className="w-full max-w-md">
                            <p className="text-sm mb-2">Create a new team and generate an invite code for your teammates.</p>
                            <input
                              type="text"
                              value={teamName}
                              onChange={(e) => {
                                const value = e.target.value.slice(0, 20);
                                setTeamName(value);
                              }}
                              placeholder="Enter team name (max 20 chars)"
                              className="w-full p-2 border rounded mb-3"
                              maxLength={20}
                              required
                            />
                            <Button 
                              className="w-full" 
                              onClick={generateMultiUseInvite}
                              disabled={isGeneratingInvite || teamName.trim().length === 0}
                            >
                              {isGeneratingInvite ? "Creating Team..." : "Create Team & Generate Invite"}
                            </Button>
                          </div>
                        ) : (
                          <div className="w-full max-w-md">
                            {showInviteWarning && (
                              <Alert variant="warning" className="mb-4">
                                <BsExclamationTriangle className="h-4 w-4" />
                                <AlertTitle>Important!</AlertTitle>
                                <AlertDescription>
                                  This invite code will only be shown once. Please take a screenshot or save it now.
                                </AlertDescription>
                              </Alert>
                            )}
                            
                            <div className="bg-white p-4 rounded-lg border mb-4">
                              <QRCode value={inviteCode} size={200} className="w-full" />
                            </div>
                            
                            <div className="flex items-center space-x-2 mb-4">
                              <input
                                type="text"
                                value={inviteCode}
                                readOnly
                                className="flex-1 p-2 border rounded bg-gray-50"
                              />
                              <Button 
                                onClick={() => {
                                  navigator.clipboard.writeText(inviteCode);
                                  toast.success("Invite code copied to clipboard");
                                }}
                                className="flex items-center space-x-1"
                              >
                                <BsLink45Deg />
                                <span>Copy</span>
                              </Button>
                            </div>
                            
                            <div className="text-xs text-gray-500 text-center">
                              Share this code with your teammates to join your team
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    
                    {/* Join Team Tab */}
                    <TabsContent value="join" className="mt-4">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-full max-w-md">
                          <div className="mb-4">
                            <p className="text-sm mb-2">Scan a team QR code or enter an invite code below:</p>
                            <div className="flex space-x-2">
                              <input
                                type="text"
                                value={joinTeamCode}
                                onChange={(e) => setJoinTeamCode(e.target.value)}
                                placeholder="Enter invite code"
                                className="flex-1 p-2 border rounded"
                              />
                              <Button onClick={() => startScanner()} className="flex items-center space-x-1">
                                <BsQrCode />
                                <span>Scan</span>
                              </Button>
                            </div>
                          </div>
                          
                          {true && (
                            <div className={`relative w-full aspect-square mb-4 max-w-[250px] m-auto ${hasCamera ? "" : "hidden"}`}>
                              <video ref={videoRef} className="w-full h-full object-cover rounded-lg" />
                              <Button 
                                onClick={() => {
                                  if (qrScanner) {
                                    qrScanner.stop();
                                    setHasCamera(false);
                                  }
                                }} 
                                className={`absolute bottom-2 right-2 ${buttonStyles.danger}`}
                                size="sm"
                              >
                                Stop Scanner
                              </Button>
                            </div>
                          )}
                          
                          {scanResult && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
                              <p className="text-sm text-green-800 font-medium">QR Code scanned successfully!</p>
                              <p className="text-xs text-green-700 mt-1">Invite code: {scanResult}</p>
                            </div>
                          )}
                          
                          <Button 
                            className="w-full" 
                            onClick={async () => {
                              const inviteData = decodeBase58Invite(joinTeamCode);
                              await joinTeam(inviteData.signature, inviteData.teamId, inviteData.expiry);
                            }}
                            disabled={!joinTeamCode || isJoiningTeam}
                          >
                            {isJoiningTeam ? "Joining Team..." : "Join Team"}
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                )}
              </div>
              )}
            </div>
          )}
          </div>
          <div className="mt-8 border-t pt-6 p-6 flex flex-col w-full">
            <div className="flex items-center justify-between mb-4"></div>
            
            
            {/* Start Hunt button - always visible */}
            <Button
              type="submit"
              size="lg"
              onClick={handleHuntStart}
              disabled={isStartingHunt || isGeneratingRiddles}
              className={cn(
                `w-full text-white ${buttonStyles.primary}`
              )}
            >
              {isRetrying 
                ? `Retrying... (${retryCount}/${MAX_RETRIES})`
                : (isStartingHunt || isGeneratingRiddles) 
                  ? "Starting Hunt..." 
                  : "Start Hunt"
              }
            </Button>
          </div>
        </div>

        {huntId && <HuddleRoom huntId={huntId} />}
        
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
