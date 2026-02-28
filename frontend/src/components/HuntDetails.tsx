import { useParams, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { HuntDetailsSkeleton } from "./HuntDetailsSkeleton";
import { useState, useEffect, useRef } from "react";
import {
  BsQrCode,
  BsExclamationTriangle,
  BsLink45Deg,
  BsCalendar2DateFill,
  BsGeoAlt,
  BsCamera,
  BsCopy,
} from "react-icons/bs";
import { TbUsersGroup } from "react-icons/tb";
import { IoIosPeople } from "react-icons/io";
import { HuddleRoom } from "./HuddleRoom";
import { useReadContract, useActiveAccount, useSendTransaction } from "thirdweb/react";
import { getContract, prepareContractCall, readContract } from "thirdweb";
import { useNetworkState } from "../lib/utils";
import { toast } from "@/components/ui/toast";
import { client } from "../lib/client";
import QRCode from "react-qr-code";
import QrScanner from "qr-scanner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { generateInviteHash, encodeInviteToBase58, calculateInviteExpiry, decodeBase58Invite, signMessageWithEIP191 } from "../utils/inviteUtils.ts";
import { extractTeamIdFromTransactionLogs } from "../utils/transactionUtils.ts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { huntABI } from "../assets/hunt_abi.ts";
import { useGenerateRiddles } from "@/hooks/useGenerateRiddles.ts";
import { Hunt, Team, HUNT_TYPE, enumToHuntType } from "../types";
import { buttonStyles } from "../lib/styles.ts";
import { withRetry, MAX_RETRIES } from "@/utils/retryUtils";
import { FiRefreshCw } from "react-icons/fi";
import { BsBarChartFill } from "react-icons/bs";
import { Leaderboard } from "./Leaderboard";
import { 
  checkProgressAndNavigate, 
  getTeamIdentifier,
  checkHuntStarted
} from "../utils/progressUtils";
import { AddressDisplay } from "./AddressDisplay";
import { isValidHexAddress, hasRequiredTeamParams, isDefined } from "../utils/validationUtils";

const BACKEND_URL = import.meta.env.VITE_PUBLIC_BACKEND_URL;

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
  const [teamNameToCreate, setTeamNameToCreate] = useState("");
  
  // Join team loading state
  const [isJoiningTeam, setIsJoiningTeam] = useState(false);
  
  // Leaderboard state
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  
  
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
  
  // Cyclic loading message state
  const [loadingMessage, setLoadingMessage] = useState("Starting hunt");
  const messageIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messageIndexRef = useRef(0);
  
  // Retry state for decrypt-clues API call
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  // Hunt start attestation state (to prevent duplicates)
  const huntStartCreationInProgress = useRef(false);
  const huntStartCreatedForTeam = useRef<string | null>(null);

  // State to track if the user has already started the hunt (for disabling team management)
  const [hasStartedHunt, setHasStartedHunt] = useState(false);
  const [isCheckingHuntStart, setIsCheckingHuntStart] = useState(false);

  // Use the reactive network state hook
  const { contractAddress, chainId, currentChain } = useNetworkState();

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

  const { data: teamData, refetch: refetchTeamData, isLoading: teamDataLoading } = useReadContract({
    contract,
    method: "getTeam",
    params: [BigInt(huntId || 0), userWallet as `0x${string}`],
    queryOptions: { enabled: !!userWallet }, // Only call when userWallet is available
  }) as { data: Team | undefined; error: Error | undefined; refetch: () => void; isLoading: boolean };

  // Get team identifier for progress checking and huddle rooms
  const teamIdentifier = getTeamIdentifier(teamData, userWallet || "");

  // Determine hunt type from contract data: 0 = GEO_LOCATION, 1 = IMAGE
  const huntTypeDisplay = huntData?.huntType !== undefined 
    ? enumToHuntType(Number(huntData.huntType))
    : HUNT_TYPE.GEO_LOCATION; // Default to GEO_LOCATION for backward compatibility

  const joinTeam = async (signature: string, teamId: string, expiry: number) => {
    setIsJoiningTeam(true);
    try {
      if (!signature || !teamId || !expiry) {
        console.warn("[joinWithInvite] Missing required params");
      }

      if (!/^0x[0-9a-fA-F]+$/.test(signature)) {
        console.warn("[joinWithInvite] Signature may be malformed (expected 0x-hex)");
      }

      if (Number.isNaN(Number(teamId))) {
        console.warn("[joinWithInvite] teamId is not a number");
      }

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

      sendTransaction(transaction as any, {
        onSuccess: () => {
          console.info("Join with invite transaction completed");
          toast.success("Team joined successfully!");
          // Refetch team data to show updated team info
          refetchTeamData();
          setIsJoiningTeam(false);
        },
        onError: (error) => {
          const anyErr = error as any;
          console.error("[joinWithInvite] Transaction failed:", anyErr?.reason || anyErr?.shortMessage || error?.message);
          toast.error("Failed to join team");
          setIsJoiningTeam(false);
        }
      });
    } catch (err) {
      console.error("[joinWithInvite] Unexpected error before send:", (err as Error)?.message);
      toast.error("Failed to prepare join transaction");
      setIsJoiningTeam(false);
    }
  }

  // Create hunt start attestation (only once per team when starting the hunt)
  // Uses clueIndex: 0 and attemptCount: 0 to indicate hunt start
  const createHuntStartAttestation = async () => {
    if (!hasRequiredTeamParams({ huntId, chainId, contractAddress, teamIdentifier }) || !isDefined(userWallet)) {
      console.info("Missing required data for hunt start attestation");
      return;
    }

    // Generate unique key for this team/hunt combination
    const teamHuntKey = `${huntId}-${teamIdentifier}`;
    
    // Check if we've already created attestation for this team/hunt
    if (huntStartCreatedForTeam.current === teamHuntKey) {
      console.info("Hunt start attestation already created in this session");
      return;
    }

    // Check if creation is already in progress (prevent race condition)
    if (huntStartCreationInProgress.current) {
      console.info("Hunt start attestation creation already in progress");
      return;
    }

    try {
      // Set lock to prevent duplicate calls
      huntStartCreationInProgress.current = true;

      // Check if hunt start attestation already exists using retry-attempts endpoint with clueIndex: 0
      const response = await fetch(
        `${BACKEND_URL}/hunts/${huntId}/clues/0/teams/${teamIdentifier}/attempts?chainId=${chainId}&contractAddress=${contractAddress}`
      );
      
      if (!response.ok) {
        console.error("Failed to check hunt start:", response.status);
        return;
      }

      const data = await response.json();
      
      // If hunt start attestation already exists (attemptCount > 0), don't create another one
      if (data.attemptCount > 0) {
        huntStartCreatedForTeam.current = teamHuntKey;
        return;
      }

      // Create hunt start attestation using attest-attempt endpoint with clueIndex: 0
      const requestPayload = {
        teamIdentifier,
        teamName: (teamData?.name && teamData.name.length > 0) ? teamData.name : userWallet,
        huntId: parseInt(huntId!),
        clueIndex: 0, // Special value for hunt start
        solverAddress: userWallet,
        attemptCount: 0, // Special value for hunt start
        chainId: chainId,
        contractAddress: contractAddress,
      };

      const createResponse = await fetch(`${BACKEND_URL}/attestations/attempts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      });

      if (!createResponse.ok) {
        console.error("Failed to create hunt start attestation:", createResponse.status);
        return;
      }

      await createResponse.json();
      console.info("Hunt start attestation created");

      // Mark as created for this team/hunt combination
      huntStartCreatedForTeam.current = teamHuntKey;
    } catch (error) {
      console.error("Error creating hunt start attestation:", (error as Error)?.message);
    } finally {
      // Always release lock
      huntStartCreationInProgress.current = false;
    }
  };

  const handleHuntStart = async () => {
    setIsStartingHunt(true);
    setRetryCount(0);
    setIsRetrying(false);
    
    // Setup cyclic loading messages with ref for proper cleanup
    const messages = ["Starting hunt...", "Decrypting clues...", "Validating access..."];
    messageIndexRef.current = 0;
    setLoadingMessage(messages[0]);
    
    // Clear any existing interval
    if (messageIntervalRef.current) {
      clearInterval(messageIntervalRef.current);
    }
    
    messageIntervalRef.current = setInterval(() => {
      messageIndexRef.current = (messageIndexRef.current + 1) % messages.length;
      setLoadingMessage(messages[messageIndexRef.current]);
    }, 2000); // Change message every 2 seconds
    
    if (!userWallet) {
      toast.error("Please connect your wallet first");
      if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
      setIsStartingHunt(false);
      return;
    }

    if (!huntData?.clues_blobId || !huntData?.answers_blobId) {
      toast.error("Hunt data not available");
      if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
      setIsStartingHunt(false);
      return;
    }

    // Check if user is registered by looking at the participants array
    const isRegistered = huntData?.participants?.includes(userWallet) ?? false;

    if (!isRegistered) {
      toast.error(
        "You are not eligible for this hunt. Please register or check the requirements."
      );
      if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
      setIsStartingHunt(false);
      return;
    }

    // Check if user has existing progress
    try {
      // Get total clues from localStorage (set when clues are decrypted)
      const currentClueData = JSON.parse(
        localStorage.getItem(`hunt_riddles_${huntId}`) || "[]"
      );
      const totalClues = currentClueData.length;

      // If we have clues data, check progress
      if (totalClues > 0 && chainId && contractAddress) {
        const shouldContinue = await checkProgressAndNavigate(
          parseInt(huntId || "0"),
          teamIdentifier,
          totalClues,
          navigate,
          chainId,
          contractAddress
        );
        
        if (shouldContinue) {
          // User was redirected, stop here
          if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
          setIsStartingHunt(false);
          return;
        }
        // If shouldContinue is false, continue with normal flow (first time starting)
      }
    } catch (error) {
      console.error("Error checking progress, continuing with normal flow:", (error as Error)?.message);
      // Continue with normal flow if progress check fails
    }

    const decryptCluesOperation = async (): Promise<void> => {
      const headersList = {
        Accept: "*/*",
        "Content-Type": "application/json",
      };

      const bodyContent = JSON.stringify({
        userAddress: userWallet,
        clues_blobId: huntData.clues_blobId,
        answers_blobId: huntData.answers_blobId,
      });

      const response = await fetch(`${BACKEND_URL}/clues/decrypt`, {
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

      await fetchRiddles(clues, huntId || "0", huntData?.theme || "");
      
      // Create hunt start attestation after clues are successfully loaded
      await createHuntStartAttestation();
      
      navigate(`/hunt/${huntId}/clue/1`);
    };

    try {
      await withRetry(decryptCluesOperation, {
        onRetry: (attempt, error) => {
          console.error("Decrypt clues error (attempt " + attempt + "):", (error as Error)?.message);
          setIsRetrying(true);
          setRetryCount(attempt);
        }
      });
      
      // Reset retry state on success
      setRetryCount(0);
      setIsRetrying(false);
    } catch (error) {
      console.error("Error starting hunt:", (error as Error)?.message);
      toast.error("Failed to start hunt");
    } finally {
      if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
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
              console.error("Error joining team:", (error as Error)?.message);
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
      console.error('Error accessing camera:', (error as Error)?.message);
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

  // Clean up loading message interval when component unmounts
  useEffect(() => {
    return () => {
      if (messageIntervalRef.current) {
        clearInterval(messageIntervalRef.current);
      }
    };
  }, []);

  // Check if user is already in a team
  const isUserInTeam = teamData && teamData.members && teamData.members.includes(userWallet as `0x${string}`);
  
  // Reset join team code when switching tabs
  useEffect(() => {
    if (activeTab === 'join') {
      setJoinTeamCode("");
      setScanResult(null);
    }
  }, [activeTab]);
  

  // Check if the user has already started the hunt (to disable team management)
  useEffect(() => {
    const checkIfHuntStarted = async () => {
      // Only check if we have all required data
      if (!huntId || !teamIdentifier || !chainId || !contractAddress) {
        return;
      }

      setIsCheckingHuntStart(true);
      try {
        const started = await checkHuntStarted(
          parseInt(huntId),
          teamIdentifier,
          chainId,
          contractAddress
        );
        setHasStartedHunt(started);
      } catch (error) {
        console.error("Error checking if hunt started:", (error as Error)?.message);
      } finally {
        setIsCheckingHuntStart(false);
      }
    };

    checkIfHuntStarted();
  }, [huntId, teamIdentifier, chainId, contractAddress]);

  // Show loading state while hunt data is being fetched
  if (huntLoading) {
    return (
      <div className="min-h-screen bg-background pt-20 px-4 mb-[90px]">
        <div className="max-w-4xl mx-auto">
          <HuntDetailsSkeleton />
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

    const trimmedName = (teamNameToCreate || "").trim();
    if (!trimmedName || trimmedName.length > 20) {
      toast.error("Team name is required and must be 1-20 characters");
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
        params: [BigInt(huntId || 0), trimmedName],
      });

      sendTransaction(transaction as any, {
        onSuccess: async (result) => {
          console.info("Team creation transaction completed");
          toast.success("Team created successfully!");
          
          // Refetch team data immediately
          refetchTeamData();

          try {
            toast.info("Getting transaction receipt and doing the magic...");
            
            // Extract teamId from transaction logs
            const teamId = await extractTeamIdFromTransactionLogs(
              result.transactionHash,
              contractAddress,
              currentChain
            );

            // Success! We have the teamId from the logs
            toast.dismiss(); // Dismiss the loading toast
            toast.success("Generating invite...");
            await generateInviteAfterTeamCreation(teamId);
            // Refetch again after invite generation
            refetchTeamData();
            
          } catch (error) {
            console.error("Error extracting teamId from transaction logs:", (error as Error)?.message);

            try {
              toast.loading("Its taking longer than expected...");

              const getTeamIdOperation = async (): Promise<string> => {
                const teamId = await readContract({
                  contract,
                  method: "getParticipantTeamId",
                  params: [BigInt(huntId || 0), userWallet as `0x${string}`],
                });

                if (teamId && teamId.toString() !== "0") {
                  return teamId.toString();
                } else {
                  throw new Error("temporarily unavailable: teamId not found yet - transaction may not be mined");
                }
              };

              const teamId = await withRetry(getTeamIdOperation, {
                maxRetries: MAX_RETRIES,
                initialDelay: 2000,
                onRetry: (attempt, error) => {
                  console.error("Retry getParticipantTeamId:", attempt, (error as Error)?.message);
                  toast.dismiss(); // Dismiss previous loading toast
                  toast.loading(`Still waiting for confirmation... (attempt ${attempt + 1}/${MAX_RETRIES})`);
                }
              });

              toast.dismiss(); // Dismiss the loading toast
              toast.success("Confirmed on-chain. Generating invite...");
              await generateInviteAfterTeamCreation(teamId);
              refetchTeamData();
              
            } catch (fallbackError) {
              console.error("Fallback getParticipantTeamId failed:", (fallbackError as Error)?.message);
              toast.error("Team created but could not generate invite. Please try again.", { id: undefined });
              setIsGeneratingInvite(false);
            }
          }
        },
        onError: (error) => {
          console.error("Team creation transaction failed:", (error as Error)?.message);
          toast.error("Failed to create team");
          setIsGeneratingInvite(false);
        }
      });
    } catch (error) {
      console.error("Error preparing team creation transaction:", (error as Error)?.message);
      toast.error("Failed to prepare transaction");
      setIsGeneratingInvite(false);
    }
  };

  // Separate function to handle invite generation after team creation
  const generateInviteAfterTeamCreation = async (teamId: string) => {
    if (!account || !huntData || !teamId) {
      toast.error("Missing required data for invite generation");
      setIsGeneratingInvite(false);
      return;
    }

    try {
      // Calculate expiry time (current time + 1 hour)
      const expiryTime = calculateInviteExpiry();
      
      // Generate invite hash
      const hash = generateInviteHash(
        teamId,
        expiryTime,
        chainId,
        contractAddress
      );
      const signature = await signMessageWithEIP191(hash, account);
      const encodedInvite = encodeInviteToBase58(
        teamId,
        expiryTime,
        signature
      );

      setInviteCode(encodedInvite);
      setShowInviteWarning(true);
      console.info("Invite generation completed");
    } catch (error) {
      console.error("Error generating invite:", (error as Error)?.message);
      toast.error("Failed to generate invite code");
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20 px-4 mb-[90px]">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Hunt Info Card */}
        <Card className="bg-white ">
          <CardHeader className="bg-main text-main-foreground p-6 border-b-2 border-black -my-6  ">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex-1 wrap-break-word font-bold">
                {huntData?.name || 'Hunt Details'}
              </CardTitle>
              <Button
                onClick={() => setIsLeaderboardOpen(true)}
                variant="neutral"
                size="sm"
                className="p-2 border-2 border-black shadow-[-2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[-1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                <BsBarChartFill className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="mt-4">
            {huntData && (
              <>
                <p className="text-foreground/70 font-base mb-6 ">{huntData.description}</p>
                
                {/* Hunt Details Section */}
                <div className="bg-muted rounded-lg p-6 mb-6 border-2 border-black shadow-[-2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Date and Time */}
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-main rounded-lg border-2 border-black">
                        <BsCalendar2DateFill className="w-6 h-6 text-main-foreground" />
                      </div>
                      <div>
                        <p className="text-sm text-foreground/60 font-semibold uppercase tracking-wide">Date & Time</p>
                        <p className="text-sm text-foreground">
                          {new Date(Number(huntData.startTime) * 1000).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {new Date(Number(huntData.startTime) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(Number(huntData.endTime) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    
                    {/* Participants */}
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-main rounded-lg border-2 border-black">
                        <IoIosPeople className="w-6 h-6 text-main-foreground" />
                      </div>
                      <div>
                        <p className="text-sm text-foreground/60 font-semibold uppercase tracking-wide">Participants</p>
                        <p className="text-sm text-foreground">
                          {Number(huntData.participantCount)} Registered
                        </p>
                      </div>
                    </div>
                    
                    {/* Hunt Type */}
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-main rounded-lg border-2 border-black">
                        {huntTypeDisplay === HUNT_TYPE.IMAGE ? (
                          <BsCamera className="w-6 h-6 text-main-foreground" />
                        ) : (
                          <BsGeoAlt className="w-6 h-6 text-main-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-foreground/60 font-semibold uppercase tracking-wide">Clue Verification</p>
                        <p className="text-sm text-foreground">
                          {huntTypeDisplay === HUNT_TYPE.IMAGE ? 'Image Based' : 'Location Based'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Teams Status */}
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-main rounded-lg border-2 border-black">
                        <TbUsersGroup className="w-6 h-6 text-main-foreground" />
                      </div>
                      <div>
                        <p className="text-sm text-foreground/60 font-semibold uppercase tracking-wide">Teams</p>
                        <p className="text-sm text-foreground">
                          {huntData?.teamsEnabled ? 'Enabled' : 'Disabled'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div> 
              </>
            )}
          </CardContent>
          
        </Card>

        {/* Team Management Card - Only show if teams are enabled */}
        {huntData?.teamsEnabled && (
          <Card className="bg-white ">
            <CardHeader className="bg-accent text-accent-foreground p-6 border-b-2 border-black -my-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold">Team Management</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={refetchTeamData}
                    variant="neutral"
                    size="sm"
                    className="p-1 h-8 w-8 border-2 border-black shadow-[-2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[-1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    <FiRefreshCw className={teamDataLoading ? 'animate-spin' : ''} />
                  </Button>
                  <Button
                    onClick={refetchTeamData}
                    variant="neutral"
                    size="sm"
                    className="hidden sm:block border-2 border-black shadow-[-2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[-1px_1px_0px_0px_rgba(0,0,0,1)] transition-all font-bold"
                  >
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {/* Show team info if user is already in a team */}
              {isUserInTeam ? (
                <>
                  <div className="space-y-6">
                    {/* Team name and members */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <h4 className="">
                          Team: {(teamData?.name && teamData.name.length > 0) ? teamData.name : `Team #${teamData?.teamId ?? ""}`}
                        </h4>
                        <span className="font-bold text-lg mr-1">{teamData?.memberCount?.toString() || '0'}/{teamData?.maxMembers?.toString() || '0'}</span>
                      </div>
                      <div className="space-y-2">
                        {(teamData?.members || []).map((member, index) => (
                          <div key={index} className="flex items-center gap-4 p-4 bg-muted rounded-lg border-2 border-black shadow-[-2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[-1px_1px_0px_0px_rgba(0,0,0,1)] transition-all">
                            <div className="relative">
                              <img 
                                src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${member}`}
                                alt="Member Avatar"
                                className="w-12 h-12 rounded-lg border-2 border-black"
                              />
                              {member === teamData?.owner && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-main rounded-full border-2 border-black flex items-center justify-center">
                                  <span className="text-xs font-bold text-main-foreground">👑</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              {member ? (
                                <AddressDisplay address={member} className="font-semibold text-sm" />
                              ) : (
                                <span className="font-bold text-sm text-foreground/60">Unknown Member</span>
                              )}
                            </div>
                          </div>
                        ))}
                        {(!teamData?.members || teamData.members.length === 0) && (
                          <div className="text-sm text-foreground/60 italic p-4 bg-muted rounded-lg border-2 border-black text-center">
                            No members found
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Show invite QR code if user is the team owner and has generated one */}
                    {teamData?.owner === userWallet && inviteCode && (
                      <div className="mt-6 p-4 bg-muted rounded-lg border-2 border-black shadow-[-2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <h4 className="text-md font-bold mb-4">Team Invite Code</h4>
                        <div className="flex flex-col items-center space-y-4">
                          <div className="bg-background p-4 rounded-lg border-2 border-black shadow-[-2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <QRCode value={inviteCode} size={150} />
                          </div>
                          <div className="flex items-center space-x-2 w-full max-w-md">
                            <input
                              type="text"
                              value={inviteCode}
                              readOnly
                              className="flex-1 p-2 border-2 border-black rounded-sm bg-muted text-xs font-mono"
                            />
                            <Button 
                              onClick={() => {
                                navigator.clipboard.writeText(inviteCode);
                                toast.success("Invite code copied to clipboard");
                              }}
                              variant="neutral"
                              size="sm"
                            >
                              <BsCopy />
                              <span>Copy</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : hasStartedHunt ? (
                // Show message when user has already started the hunt
                <div className="space-y-4">
                  <Alert variant="default" className="border-2 border-black shadow-[-2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <BsExclamationTriangle className="h-4 w-4" />
                    <AlertTitle className="font-bold">Hunt Already Started</AlertTitle>
                    <AlertDescription className="font-medium">
                      You have already started this hunt. Team creation and joining is no longer available once a hunt has been started.
                    </AlertDescription>
                  </Alert>
                  <p className="text-sm text-foreground/60 text-center font-medium">
                    Click 'Resume Hunt' below to continue.
                  </p>
                </div>
              ) : isCheckingHuntStart ? (
                // Show loading state while checking if hunt has started
                <div className="space-y-3 py-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                </div>
              ) : (
                // Show create/join options when user is not in a team
                <Tabs defaultValue="create" onValueChange={(value) => setActiveTab(value as "create" | "join")}>
                  <TabsList className="grid w-full grid-cols-2 mb-4 border-2 border-black shadow-[-2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <TabsTrigger value="create" className="font-bold">Create Team</TabsTrigger>
                    <TabsTrigger value="join" className="font-bold">Join Team</TabsTrigger>
                  </TabsList>
                
                  {/* Create Team Tab */}
                  <TabsContent value="create" className="mt-4">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      {!inviteCode ? (
                        <div className="w-full max-w-md">
                          <p className="text-sm mb-4 font-medium">Create a new team and generate an invite code for your teammates.</p>
                          <div className="space-y-2 mb-4">
                            <input
                              id="team-name"
                              type="text"
                              value={teamNameToCreate}
                              onChange={(e) => setTeamNameToCreate(e.target.value.slice(0, 20))}
                              placeholder="Give your team a name"
                              maxLength={20}
                              className="w-full p-2 border-2 border-black rounded-sm placeholder:text-gray-500 placeholder:italic text-sm"
                            />
                            {teamNameToCreate.length > 0 && teamNameToCreate.length > 20 && (
                              <p className="text-xs text-destructive">Maximum 20 characters</p>
                            )}
                          </div>
                          <Button 
                            className="w-full border-2 border-black shadow-[-4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[-2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-bold" 
                            onClick={generateMultiUseInvite}
                            disabled={isGeneratingInvite || isStartingHunt || isGeneratingRiddles || !(teamNameToCreate || "").trim() || (teamNameToCreate || "").trim().length > 20}
                          >
                            {isGeneratingInvite ? "Creating Team..." : "Create Team & Generate Invite"}
                          </Button>
                        </div>
                      ) : (
                        <div className="w-full max-w-md">
                          {showInviteWarning && (
                            <Alert variant="default" className="mb-4 border-2 border-black shadow-[-2px_2px_0px_0px_rgba(0,0,0,1)]">
                              <BsExclamationTriangle className="h-4 w-4" />
                              <AlertTitle className="font-bold">Important!</AlertTitle>
                              <AlertDescription className="font-medium">
                                This invite code will only be shown once. Please take a screenshot or save it now.
                              </AlertDescription>
                            </Alert>
                          )}
                          
                          <div className="bg-background p-4 rounded-lg border-2 border-black shadow-[-2px_2px_0px_0px_rgba(0,0,0,1)] mb-4">
                            <QRCode value={inviteCode} size={200} className="w-full" />
                          </div>
                          
                          <div className="flex items-center space-x-2 mb-4">
                            <input
                              type="text"
                              value={inviteCode}
                              readOnly
                              className="flex-1 p-2 border-2 border-black rounded-sm bg-muted font-mono"
                            />
                            <Button 
                              onClick={() => {
                                navigator.clipboard.writeText(inviteCode);
                                toast.success("Invite code copied to clipboard");
                              }}
                              variant="neutral"
                              className="flex items-center space-x-1 border-2 border-black shadow-[-2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[-1px_1px_0px_0px_rgba(0,0,0,1)] transition-all font-bold"
                            >
                              <BsLink45Deg />
                              <span>Copy</span>
                            </Button>
                          </div>
                          
                          <div className="text-xs text-foreground/60 text-center font-medium">
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
                          <p className="text-sm mb-6 font-medium">Scan a team QR code or enter an invite code below</p>
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              value={joinTeamCode}
                              onChange={(e) => setJoinTeamCode(e.target.value)}
                              placeholder="Enter invite code"
                              className="flex-1 p-2 border-2 border-black rounded-sm placeholder:text-gray-500 placeholder:italic text-sm"
                            />
                            <Button onClick={() => startScanner()} size="sm">
                              <BsQrCode />
                              <span>Scan</span>
                            </Button>
                          </div>
                        </div>
                        
                        {true && (
                          <div className={`relative w-full aspect-square mb-4 max-w-[250px] m-auto ${hasCamera ? "" : "hidden"}`}>
                            <video ref={videoRef} className="w-full h-full object-cover rounded-lg border-2 border-black" />
                            <Button 
                              onClick={() => {
                                if (qrScanner) {
                                  qrScanner.stop();
                                  setHasCamera(false);
                                }
                              }} 
                              className={`absolute bottom-2 right-2 ${buttonStyles.danger} border-2 border-black shadow-[-2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[-1px_1px_0px_0px_rgba(0,0,0,1)] transition-all font-bold`}
                              size="sm"
                            >
                              Stop Scanner
                            </Button>
                          </div>
                        )}
                        
                        {scanResult && (
                          <div className="p-3 bg-green-50 border-2 border-green-400 rounded-lg mb-4 shadow-[-2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <p className="text-sm text-green-800 font-bold">QR Code scanned successfully!</p>
                            <p className="text-xs text-green-700 mt-1 font-mono">Invite code: {scanResult}</p>
                          </div>
                        )}
                        
                        <Button 
                          className="w-full border-2 border-black shadow-[-4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[-2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-bold" 
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
            </CardContent>
          </Card>
        )}

        {/* Start Hunt Button - Always visible */}
        <Button
          type="submit"
          size="lg"
          onClick={handleHuntStart}
          disabled={isStartingHunt || isGeneratingRiddles}
          className="w-full font-bold"
        >
          {isRetrying 
            ? `Retrying... (${retryCount}/${MAX_RETRIES})`
            : (isStartingHunt || isGeneratingRiddles) 
              ? `${loadingMessage}...` 
              : hasStartedHunt 
                ? "Resume Hunt" 
                : "Start Hunt"
          }
        </Button>

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
