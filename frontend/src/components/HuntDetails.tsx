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
import { getContract, prepareContractCall } from "thirdweb";
import { CONTRACT_ADDRESSES } from "../lib/utils";
import { toast } from "sonner";
import { client } from "../lib/client";
import { baseSepolia, paseoAssetHub } from "../lib/chains";
import QRCode from "react-qr-code";
import QrScanner from "qr-scanner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { generateInviteHash, encodeInviteToBase58, calculateInviteExpiry, decodeBase58Invite } from "../helpers/inviteUtils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { huntABI } from "../assets/hunt_abi.ts";
import { useGenerateRiddles } from "@/hooks/useGenerateRiddles.ts";
import { Hunt, Team } from "../types";

const BACKEND_URL = import.meta.env.VITE_PUBLIC_BACKEND_URL;

// Type guard to ensure address is a valid hex string
function isValidHexAddress(address: string): address is `0x${string}` {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

export function HuntDetails() {
  const { huntId } = useParams();
  const navigate = useNavigate();
  // Team status state
  const [showTeamInfo, setShowTeamInfo] = useState<boolean>(false);
  
  // Team management state
  const [teamCode, setTeamCode] = useState<string>(""); // Default team code
  const [activeTab, setActiveTab] = useState<"create" | "join" | "invite">("create");
  const [hasCamera, setHasCamera] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  
  // Multi-use invite state
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);
  const [showInviteWarning, setShowInviteWarning] = useState(false);
  
  // localStorage key for invite codes
  const getInviteStorageKey = () => `invite_code_${huntId}_${userWallet}`;
  
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

  // Add this to get current network from localStorage
  const currentNetwork = localStorage.getItem("current_network") || "assetHub";
  const contractAddress =
    CONTRACT_ADDRESSES[currentNetwork as keyof typeof CONTRACT_ADDRESSES] ??
    "0x0000000000000000000000000000000000000000";

  if (!isValidHexAddress(contractAddress)) {
    toast.error("Invalid contract address format");
    return null;
  }

  const contract = getContract({
    client,
    chain: currentNetwork === "base" ? baseSepolia : paseoAssetHub,
    address: contractAddress as `0x${string}`,
    abi: huntABI,
  });

  // Get hunt details from contract - now returns HuntInfo struct directly
  const { data: huntData, isLoading: huntLoading } = useReadContract({
    contract,
    method: "getHunt",
    params: [BigInt(huntId || 0)],
  }) as { data: Hunt | undefined; isLoading: boolean };

  const { data: teamData, error: teamError } = useReadContract({
    contract,
    method: "getTeam",
    params: [BigInt(huntId || 0)],
  }) as { data: Team | undefined; error: Error | undefined };

  const joinTeam = (signature: string, teamId: string) => {

    const huntStartTime = Number(huntData?.startTime);
    const huntDuration = Number(huntData?.endTime) - Number(huntData?.startTime);
    const expiryTime = calculateInviteExpiry(huntStartTime, huntDuration);

    const transaction = prepareContractCall({
      contract: {
        address: contractAddress as `0x${string}`,
        abi: huntABI,
        chain: currentNetwork === "base" ? baseSepolia : paseoAssetHub,
        client,
      },
      method: "joinWithInvite",
      params: [BigInt(teamId || 0), BigInt(expiryTime), signature as `0x${string}`],
    });

    // Execute the transaction and get the result
    sendTransaction(transaction as any, {
      onSuccess: (result) => {
        console.log("Transaction successful:", result);
        toast.success("Team joined successfully!");
      },
      onError: (error) => {
        console.error("Transaction failed:", error);
        toast.error("Failed to join team");
      }
    });
  }

  const handleHuntStart = async () => {
    setIsStartingHunt(true);
    
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

    try {
      // Check if user is registered by looking at the participants array
      const isRegistered = huntData?.participants?.includes(userWallet) ?? false;

      if (!isRegistered) {
        toast.error(
          "You are not eligible for this hunt. Please register or check the requirements."
        );
        setIsStartingHunt(false);
        return;
      }

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

      const data = await response.text();
      const clues = JSON.parse(data);

      console.log("Clues: ", clues);

      await fetchRiddles(clues, huntId || "0", huntData?.theme || "");
      navigate(`/hunt/${huntId}/clue/1`);
    } catch (error) {
      console.error("Error starting hunt:", error);
      toast.error("Failed to start hunt");
      setIsStartingHunt(false);
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
            setScanResult(inviteData.teamId);
            setTeamCode(inviteData.teamId);
            setInviteCode(inviteData.teamId);
            scanner.stop();
            setHasCamera(false); // Hide camera after successful scan
            toast.success("QR code scanned successfully!");

            joinTeam(inviteData.signature, inviteData.teamId);

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
  
  // Generate a new team code when the dialog is opened
  useEffect(() => {
    if (activeTab === 'create' && teamData?.teamId) {
      setTeamCode(teamData.teamId.toString());
    }
  }, [activeTab, teamData]);
  
  // Check localStorage for existing invite code on component mount
  useEffect(() => {
    if (userWallet && huntId) {
      const storedInvite = localStorage.getItem(getInviteStorageKey());
      if (storedInvite) {
        setInviteCode(storedInvite);
      }
    }
  }, [userWallet, huntId]);

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
    if (!account || !huntData) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    // Check if invite already exists in localStorage
    const existingInvite = localStorage.getItem(getInviteStorageKey());
    if (existingInvite) {
      setInviteCode(existingInvite);
      toast.info("Using existing invite code");
      return;
    }
    
    try {
      setIsGeneratingInvite(true);

      const transaction = prepareContractCall({
        contract: {
          address: contractAddress as `0x${string}`,
          abi: huntABI,
          chain: currentNetwork === "base" ? baseSepolia : paseoAssetHub,
          client,
        },
        method: "createTeam",
        params: [BigInt(huntId || 0)],
      });
      generateInviteAfterTeamCreation();
      // Execute the transaction and get the result
      sendTransaction(transaction as any, {
        onSuccess: (result) => {
          console.log("Transaction successful:", result);
          // The result contains transaction hash and receipt
          // For createTeam, you might want to get the teamId from events
          toast.success("Team created successfully!");
          
          // Continue with invite generation after successful team creation
          // generateInviteAfterTeamCreation();
        },
        onError: (error) => {
          console.error("Transaction failed:", error);
          toast.error("Failed to create team");
          setIsGeneratingInvite(false);
        }
      });

    } catch (error) {
      console.error("Error preparing transaction:", error);
      toast.error("Failed to prepare transaction");
      setIsGeneratingInvite(false);
    }
  };

  // Separate function to handle invite generation after team creation
  const generateInviteAfterTeamCreation = async () => {

    console.log("Generating invite after team creation");
    if (!account || !huntData || teamCode == "") {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      // Calculate expiry time (hunt start + 1 hour)
      const huntStartTime = Number(huntData.startTime);
      const huntDuration = Number(huntData.endTime) - Number(huntData.startTime);
      const expiryTime = calculateInviteExpiry(huntStartTime, huntDuration);
      
      // Generate invite hash
      const hash = generateInviteHash(
        teamCode,
        expiryTime,
        currentNetwork == "base" ? baseSepolia.id : paseoAssetHub.id,
        contractAddress
      );      
      // Sign the hash with wallet using the account directly
      const signature = await account.signMessage({
        message: hash,
      });
      
      // Encode the invite data
      const encodedInvite = encodeInviteToBase58(
        teamCode,
        expiryTime,
        signature
      );
      
      setInviteCode(encodedInvite);
      setShowInviteWarning(true);
      
      // Store invite code in localStorage
      localStorage.setItem(getInviteStorageKey(), encodedInvite);
    } catch (error) {
      console.error("Error generating invite:", error);
      toast.error("Failed to generate invite code");
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 px-4 mb-[90px]">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8 border-2 border-black min-h-[calc(100vh-180px)] justify-between relative flex flex-col">
          <div className="bg-green p-6 text-white">
            <div className="flex items-center justify-center">
              <h1 className="text-2xl font-bold text-white">
                {huntData?.name || 'Hunt Details'}
              </h1>
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
                    <BsCalendar2DateFill className="w-5 h-5 text-green" />
                    <div>
                      <p className="text-sm text-gray-600">Date & Time</p>
                      <p className="text-sm font-medium text-gray-800">
                        {new Date(Number(huntData.startTime) * 1000).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {new Date(Number(huntData.startTime) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(Number(huntData.endTime) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  
                  {/* Participants */}
                  <div className="flex items-center gap-2">
                    <IoIosPeople className="w-5 h-5 text-green" />
                    <div>
                      <p className="text-sm text-gray-600">Participants</p>
                      <p className="text-sm font-medium text-gray-800">
                        {Number(huntData.participantCount)} registered
                      </p>
                    </div>
                  </div>
                  
                  {/* Teams Status */}
                  <div className="flex items-center gap-2">
                    <TbUsersGroup className="w-5 h-5 text-green" />
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
                <h2 className="text-lg font-medium mb-4">Team Management</h2>
                
                {/* Conditional rendering based on team data and user actions */}
                {!teamData || (teamData && teamData.owner === userWallet && !showTeamInfo) ? (
                  // Show tabs when user is not in a team
                  <Tabs defaultValue="create" onValueChange={(value) => setActiveTab(value as "create" | "join" | "invite")}>
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="create">Create</TabsTrigger>
                      <TabsTrigger value="join">Join Team</TabsTrigger>
                    </TabsList>
                  
                  {/* Create Team Tab */}
                  {/* <TabsContent value="create" className="mt-4">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="bg-white p-4 rounded-lg border">
                        <QRCode value={teamCode} size={200} />
                      </div>
                      <p className="text-center text-sm">Share this QR code with your teammates to join your team</p>
                      <p className="text-center font-bold">Team Code: {teamCode}</p>
                    </div>
                  </TabsContent> */}
                  
                  {/* Join Team Tab */}
                  <TabsContent value="join" className="mt-4">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-full max-w-md">
                        <div className="mb-4">
                          <p className="text-sm mb-2">Scan a team QR code or enter a team code below:</p>
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              value={teamCode}
                              onChange={(e) => setTeamCode(e.target.value)}
                              placeholder="Enter team code"
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
                              className="absolute bottom-2 right-2 bg-red-500 hover:bg-red-600 text-white"
                              size="sm"
                            >
                              Stop Scanner
                            </Button>
                          </div>
                        )}
                        
                        {scanResult && (
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
                            <p className="text-sm text-green-800 font-medium">QR Code scanned successfully!</p>
                            <p className="text-xs text-green-700 mt-1">Team code: {scanResult}</p>
                          </div>
                        )}
                        
                        <Button 
                            className="w-full" 
                            onClick={
                              () => {
                                const inviteData = decodeBase58Invite(teamCode);
                                joinTeam(inviteData.signature, inviteData.teamId);
                              }
                            }
                            >
                          Join Team
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* Invite Tab */}
                  <TabsContent value="create" className="mt-4">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      {!inviteCode ? (
                        <div className="w-full max-w-md">
                          <p className="text-sm mb-4">Generate a invite code for your team. This code will expire after the hunt starts.</p>
                          <Button 
                            className="w-full" 
                            onClick={generateMultiUseInvite}
                            disabled={isGeneratingInvite}
                          >
                            {isGeneratingInvite ? "Generating..." : "Generate Invite Code"}
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
                            This invite code is saved and can be reused
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
                ) : (
                  // Show team data when user is in a team and hasn't created it themselves OR when showTeamInfo is true
                  <div className="border-t-2 border-gray-200 pt-4">
                    <h3 className="text-lg font-semibold mb-4">Your Team</h3>
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
                    </div>
                  </div>
                )}
              </div>
              )}
            </div>
          )}
          <div className="mt-8 border-t pt-6 p-6 flex flex-col w-full">
            <div className="flex items-center justify-between mb-4"></div>
            
            {/* Toggle button for team owner only - only show if teams are enabled */}
            {huntData?.teamsEnabled && teamData && teamData.owner === userWallet && (
              <Button
                type="button"
                size="lg"
                onClick={() => setShowTeamInfo(!showTeamInfo)}
                className={cn(
                  "w-full text-white transition-colors duration-300 bg-blue-600 hover:bg-blue-700 mb-4"
                )}
              >
                {showTeamInfo ? "Back to Create/Join" : "View Team Info"}
              </Button>
            )}
            
            {/* Start Hunt button - always visible */}
            <Button
              type="submit"
              size="lg"
              onClick={handleHuntStart}
              disabled={isStartingHunt || isGeneratingRiddles}
              className={cn(
                "w-full text-white transition-colors duration-300 bg-black hover:bg-gray-800"
              )}
            >
              {(isStartingHunt || isGeneratingRiddles) ? "Starting Hunt..." : "Start Hunt"}
            </Button>
          </div>
        </div>

        {huntId && <HuddleRoom huntId={huntId} />}
      </div>
    </div>
  );
}
