import { useParams, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  BsArrowLeft,
  BsQrCode,
  BsExclamationTriangle,
  BsLink45Deg,
} from "react-icons/bs";
import { TbCalendarClock } from "react-icons/tb";
import { GiSandsOfTime } from "react-icons/gi";
import { HuddleRoom } from "./HuddleRoom";
import { useReadContract, useActiveAccount } from "thirdweb/react";
import { getContract } from "thirdweb";
import { huntABI } from "../assets/hunt_abi";
import { CONTRACT_ADDRESSES } from "../lib/utils";
import { toast } from "sonner";
import { client } from "../lib/client";
import { paseoAssetHub } from "../lib/chains";
import QRCode from "react-qr-code";
import QrScanner from "qr-scanner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { generateInviteHash, encodeInviteToBase58, calculateInviteExpiry, decodeBase58Invite } from "../helpers/inviteUtils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Type guard to ensure address is a valid hex string
function isValidHexAddress(address: string): address is `0x${string}` {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

export function HuntDetails() {
  const { huntId } = useParams();
  const navigate = useNavigate();
  // Team status state
  
  // Team management state
  const [teamCode, setTeamCode] = useState<string>("abc"); // Default team code
  const [activeTab, setActiveTab] = useState<"create" | "join" | "invite">("create");
  const [hasCamera, setHasCamera] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  
  // Multi-use invite state
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);
  const [showInviteWarning, setShowInviteWarning] = useState(false);
  
  // Video reference for QR scanner
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // QR scanner instance
  const [qrScanner, setQrScanner] = useState<QrScanner | null>(null);
  
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

  if (!isValidHexAddress(contractAddress)) {
    toast.error("Invalid contract address format");
    return null;
  }

  // Extract hunt details
  const huntData = huntDetails
    ? {
        title: huntDetails[0],
        description: huntDetails[1],
        startsAt: huntDetails[2],
        duration: huntDetails[3],
      }
    : null;

  // Function to generate a random team code
  const generateTeamCode = (): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };
  
  // Generate a new team code when the dialog is opened
  useEffect(() => {
    if (activeTab === 'create') {
      setTeamCode(generateTeamCode());
    }
  }, [activeTab]);

  // Generate multi-use invite code
  const generateMultiUseInvite = async () => {
    if (!account || !huntData) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    try {
      setIsGeneratingInvite(true);
      
      // Calculate expiry time (hunt start + 1 hour)
      const huntStartTime = Number(huntData.startsAt);
      const expiryTime = calculateInviteExpiry(huntStartTime);
      
      // Generate invite hash
      const hash = generateInviteHash(
        teamCode,
        expiryTime,
        paseoAssetHub.id,
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
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8 border-2 border-black min-h-[calc(100vh-180px)] md:h-[calc(100vh-180px)] relative flex flex-col">
          <div className="bg-green p-6 text-white absolute top-0 w-full">
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
          </div>

          {huntData && (
            <div className="mt-28 px-6">
              {/* <h1 className="text-xl font-semibold mb-2">Hunt Information</h1> */}
              <h1 className="text-xl text-gray-800 mb-2 font-semibold">title of the hunt</h1>
              <p className="text-gray-600 font-base mb-4">Heyyy, this is the description of the hunt</p>
              <div className="flex gap-5 items-center"> 
              <p className="text-gray-600 mb-4 flex items-center"><TbCalendarClock className="mr-2 w-5 h-5" /><span>28th Aug 2025, 7:30 PM</span></p>
              <p className="text-gray-600 mb-4 flex items-center"><GiSandsOfTime className="mr-2 stroke-[20px] w-5 h-5" /><span>{huntData.duration.toString()} min</span></p>
                </div> 
              
              <div className="mt-6">
                <h2 className="text-lg font-medium mb-4">Team Management</h2>
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
                        
                        <Button className="w-full" onClick={() => console.log("Join team", teamCode)}>
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
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
          <div className="mt-8 border-t pt-6 p-6 flex flex-col w-full absolute bottom-0">
            <div className="flex items-center justify-between mb-4"></div>

            <Button
              type="submit"
              size="lg"
              className={cn(
                "w-full text-white transition-colors duration-300 bg-black hover:bg-gray-800"
              )}
            >
              Register
            </Button>
          </div>
        </div>

        {huntId && <HuddleRoom huntId={huntId} />}
      </div>
    </div>
  );
}
