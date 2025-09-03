import { TbLadder, TbChessKnight } from "react-icons/tb";
import { FaChess, FaDice } from "react-icons/fa";
import { BsFillCalendarDateFill } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import { useActiveAccount, useReadContract } from "thirdweb/react";
import { getContract, readContract } from "thirdweb";
import { huntABI } from "../assets/hunt_abi.ts";
import { toast } from "sonner";

import { useGenerateRiddles } from "@/hooks/useGenerateRiddles.ts";
import { TransactionButton } from "./TransactionButton";
import { Button } from "./ui/button.tsx";
import { useState, useEffect, useMemo } from "react";
import { SUPPORTED_CHAINS, CONTRACT_ADDRESSES } from "../lib/utils";
import { client } from "../lib/client";
import { paseoAssetHub } from "../lib/chains";

interface Hunt {
  name: string;
  description: string;
  startTime: bigint;
  duration: bigint;
  participantCount: bigint;
  clues_blobId: string;
  answers_blobId: string;
  nftMetadataURI: string;
}

const BACKEND_URL = import.meta.env.VITE_PUBLIC_BACKEND_URL;

// Type guard to ensure address is a valid hex string
function isValidHexAddress(address: string): address is `0x${string}` {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

export function Hunts() {
  const account = useActiveAccount();
  const address = account?.address;
  const navigate = useNavigate();
  const [currentHuntId, setCurrentHuntId] = useState<number>(0);
  // Track registration status per hunt (true if registered, false if not)
  const [huntRegistrations, setHuntRegistrations] = useState<
    Record<number, boolean>
  >({});
  const [isCheckingRegistrations, setIsCheckingRegistrations] = useState(false);
  // Track which hunt is currently starting
  const [startingHunts, setStartingHunts] = useState<Record<number, boolean>>(
    {}
  );
  // Track NFT images for each hunt
  const [nftImages, setNftImages] = useState<Record<number, string>>({});
  const [loadingImages, setLoadingImages] = useState<Record<number, boolean>>({});

  const { fetchRiddles, isLoading } = useGenerateRiddles(currentHuntId);

  // Feature flag for hunt filtering - controlled by environment variable
  const enableHuntFiltering = import.meta.env.VITE_ENABLE_HUNT_FILTERING === 'true';

  // Add this to get current network from localStorage
  const currentNetwork = localStorage.getItem("current_network") || "assetHub";
  const rawContractAddress =
    CONTRACT_ADDRESSES[currentNetwork as keyof typeof CONTRACT_ADDRESSES] ??
    "0x0000000000000000000000000000000000000000";

  // Memoize the contract instance to prevent recreation on every render
  const contract = useMemo(() => {
    if (!isValidHexAddress(rawContractAddress)) {
      return null;
    }
    const contractAddress = rawContractAddress as `0x${string}`;
    if (contractAddress === "0x0000000000000000000000000000000000000000") {
      return null;
    }
    return getContract({
      client,
      chain: paseoAssetHub,
      address: contractAddress,
      abi: huntABI,
    });
  }, [rawContractAddress]);

  // Call hooks at the top level
  const { data: hunts = [], error: huntsError } = useReadContract({
    contract: contract!,
    method: "getAllHunts",
    params: [],
  });

  const { data: nftContractAddress } = useReadContract({
    contract: contract!,
    method: "nftContract",
    params: [],
  });

  // Function to convert IPFS URL to HTTP URL
  const getImageUrl = (imageUrl: string) => {
    if (!imageUrl) return null;
    
    // If it's already an HTTP URL, return as is
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    // If it's an IPFS URL, convert to HTTP
    if (imageUrl.startsWith('ipfs://')) {
      const cid = imageUrl.replace('ipfs://', '');
      return `https://${import.meta.env.VITE_PUBLIC_IPFS_GATEWAY || 'gateway.pinata.cloud'}/ipfs/${cid}`;
    }
    
    return imageUrl;
  };

  // Function to fetch NFT metadata and extract image URL
  const fetchNFTImage = async (hunt: Hunt, index: number) => {
    if (!hunt.nftMetadataURI || loadingImages[index] || nftImages[index]) return;
    
    setLoadingImages(prev => ({ ...prev, [index]: true }));
    
    try {
      // Handle IPFS URLs
      let metadataUrl = hunt.nftMetadataURI;
      if (metadataUrl.startsWith('ipfs://')) {
        const cid = metadataUrl.replace('ipfs://', '');
        metadataUrl = `https://${import.meta.env.VITE_PUBLIC_IPFS_GATEWAY || 'gateway.pinata.cloud'}/ipfs/${cid}`;
      }
      
      const response = await fetch(metadataUrl);
      if (!response.ok) throw new Error('Failed to fetch metadata');
      
      const metadata = await response.json();
      
      // Extract image from content.image field
      if (metadata.content && metadata.content.image) {
        const imageUrl = getImageUrl(metadata.content.image);
        if (imageUrl) {
          setNftImages(prev => ({ ...prev, [index]: imageUrl }));
        }
      }
    } catch (error) {
      console.error(`Error fetching NFT image for hunt ${index}:`, error);
    } finally {
      setLoadingImages(prev => ({ ...prev, [index]: false }));
    }
  };

  // Process hunts based on feature flag
  const processedHunts = useMemo(() => {
    if (!enableHuntFiltering) {
      return hunts;
    }

    // Filter out hunts with 'Test' or 'hello' in name or description (case insensitive)
    // Also filter out hunts with descriptions smaller than 5 characters
    const filteredHunts = hunts.filter((hunt: Hunt) => {
      const nameMatch = hunt.name.toLowerCase().includes('test') || hunt.name.toLowerCase().includes('hello');
      const descriptionMatch = hunt.description.toLowerCase().includes('test') || hunt.description.toLowerCase().includes('hello');
      const descriptionTooShort = hunt.description.length < 5;
      
      return !nameMatch && !descriptionMatch && !descriptionTooShort;
    });

    // Return only the last 5 hunts
    return filteredHunts.slice(-5);
  }, [hunts, enableHuntFiltering]);

  // Check registration status for all hunts when component loads or address changes
  useEffect(() => {
    const checkRegistrationStatus = async () => {
      if (!address || !processedHunts.length || isCheckingRegistrations || !contract)
        return;

      setIsCheckingRegistrations(true);
      const registrationStatus: Record<number, boolean> = {};

      try {
        // Check registration status for each hunt
        // Note: We need to map back to original hunt indices for contract calls
        const promises = processedHunts.map(async (_, processedIndex) => {
          try {
            // Find the original index of this hunt in the full hunts array
            const originalIndex = hunts.findIndex(hunt => hunt === processedHunts[processedIndex]);
            
            const tokenId = await readContract({
              contract,
              method: "getTokenId",
              params: [BigInt(originalIndex), address],
            });

            // If tokenId > 0, user is registered for this hunt
            // Store using the processedIndex for UI consistency
            return { index: processedIndex, isRegistered: tokenId > 0n };
          } catch (error) {
            console.error(`Error checking registration for hunt ${processedIndex}:`, error);
            return { index: processedIndex, isRegistered: false };
          }
        });

        const results = await Promise.all(promises);
        results.forEach(({ index, isRegistered }) => {
          registrationStatus[index] = isRegistered;
        });

        setHuntRegistrations(registrationStatus);
      } catch (error) {
        console.error("Error checking registration status:", error);
      } finally {
        setIsCheckingRegistrations(false);
      }
    };

    checkRegistrationStatus();
  }, [address, processedHunts.length, contract, hunts]); // Added hunts dependency for mapping

  // Fetch NFT images when hunts are loaded
  useEffect(() => {
    processedHunts.forEach((hunt, index) => {
      if (hunt.nftMetadataURI && !nftImages[index] && !loadingImages[index]) {
        fetchNFTImage(hunt, index);
      }
    });
  }, [processedHunts]);



  // Early returns after all hooks
  if (!isValidHexAddress(rawContractAddress)) {
    toast.error("Invalid contract address format");
    return null;
  }

  const contractAddress = rawContractAddress as `0x${string}`;

  if (contractAddress === "0x0000000000000000000000000000000000000000") {
    toast.error("Contract address not found for the selected network");
    return null;
  }

  if (!contract) {
    return null;
  }

  //get the token getTokenId
  console.log(currentNetwork, SUPPORTED_CHAINS)
  const chainId =
    SUPPORTED_CHAINS[currentNetwork as keyof typeof SUPPORTED_CHAINS].id;

  console.log("Hunts: chainId", chainId);
  console.log("Hunts: contractAddress", contractAddress);
  console.log("NFT Contract Address:", nftContractAddress);

  const handleHuntStart = async (
    processedIndex: number,
    originalIndex: number,
    clues_blobId: string,
    answers_blobId: string
  ) => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    // Set this hunt as starting
    setStartingHunts((prev) => ({ ...prev, [processedIndex]: true }));
    setCurrentHuntId(originalIndex);

    try {
      const tokenId = await readContract({
        contract,
        method: "getTokenId",
        params: [BigInt(originalIndex), address],
      });

      if (tokenId === 0n) {
        toast.error(
          "You are not eligible for this hunt. Please register or check the requirements."
        );
        return;
      }

      console.log("Hunt ID:", originalIndex, clues_blobId, answers_blobId);
      const headersList = {
        Accept: "*/*",
        "Content-Type": "application/json",
      };

      const bodyContent = JSON.stringify({
        userAddress: "0x7F23F30796F54a44a7A95d8f8c8Be1dB017C3397",
        clues_blobId: clues_blobId,
        answers_blobId: answers_blobId,
      });

      const response = await fetch(`${BACKEND_URL}/decrypt-clues`, {
        method: "POST",
        body: bodyContent,
        headers: headersList,
      });

      const data = await response.text();
      const clues = JSON.parse(data);

      console.log("Clues: ", clues);

      await fetchRiddles(clues, originalIndex.toString());
      navigate(`/hunt/${originalIndex}/clue/1`);
    } catch (error) {
      console.error("Error reading contract:", error);
      toast.error("Failed to check hunt eligibility");
    } finally {
      // Remove this hunt from starting state
      setStartingHunts((prev) => ({ ...prev, [processedIndex]: false }));
    }
  };

  const handleRegisterSuccess = (data: any, huntIndex: number) => {
    console.log("Register success: ", data);
    toast.success("Successfully registered for hunt!");

    // Update registration status for this specific hunt
    setHuntRegistrations((prev) => ({
      ...prev,
      [huntIndex]: true,
    }));
  };

  // Add more detailed logging
  console.log("Contract Debug:", {
    contractAddress,
    chainId,
    currentNetwork,
    huntsError,
    hunts,
  });

  if (huntsError) {
    console.error("Error fetching hunts:", huntsError);
    toast.error("Failed to fetch hunts. Please check your connection.");
  }

  console.log("Debug Info:", {
    currentNetwork,
    contractAddress,
    chainId,
    address,
    hunts,
    huntsError,
  });

  console.log("Hunts: hunts", hunts);

  function formatDate(date: number) {
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");

    return Number(`${year}${month}${day}`);
  }

  const today = formatDate(Date.now());

  console.log("today", today);
  console.log("reg", huntRegistrations);

  // Array of background colors and icons to rotate through
  const bgColors = ["bg-green", "bg-orange", "bg-yellow", "bg-pink", "bg-red"];
  const icons = [
    <TbLadder className="w-10 h-10 text-white" />,
    <TbChessKnight className="w-10 h-10 text-white" />,
    <FaChess className="w-10 h-10 text-white" />,
    <FaDice className="w-10 h-10 text-white" />,
  ];

  // Function to get button text and action based on hunt state
  const getButtonConfig = (hunt: Hunt, index: number) => {
    const huntStartTime = new Date(Number(hunt.startTime)).getTime();
    const isHuntStarted = huntStartTime <= today;
    const isRegistered = huntRegistrations[index];
    const isStarting = startingHunts[index];

    if (!isHuntStarted) {
      return {
        text: "Coming Soon",
        disabled: true,
        className:
          "bg-gray-400 cursor-not-allowed text-gray-600 border border-gray-300",
        action: null,
      };
    }

    if (!isRegistered) {
      return {
        text: "Register",
        disabled: false,
        className:
          "bg-yellow/70 border border-black text-white font-semibold hover:bg-yellow-600 hover:border-yellow-700 shadow-md hover:shadow-lg transform hover:scale-[1.02]",
        action: "register",
      };
    }

    return {
      text: isStarting ? "Starting..." : "Start",
      disabled: isStarting,
      className: isStarting
        ? "bg-gray-500 border border-gray-600 text-white font-semibold cursor-not-allowed"
        : "bg-green/70 border border-green text-white font-semibold hover:bg-green hover:border-green shadow-md hover:shadow-lg transform hover:scale-[1.02]",
      action: "start",
    };
  };

  return (
    <div className="pt-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-[90px]">
      <h1 className="text-3xl font-bold my-8 text-green drop-shadow-xl">
        Hunts
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {processedHunts.map((hunt: Hunt, index: number) => {
          const buttonConfig = getButtonConfig(hunt, index);
          // Find the original index for contract interactions
          const originalIndex = hunts.findIndex(h => h === hunt);

          return (
            <div
              key={index}
              className="flex 
         bg-white rounded-lg h-48
        border-black 
          relative  
          before:absolute 
          before:inset-0 
          before:rounded-lg
          before:border-[16px]
          before:border-black
          before:-translate-x-2
          before:translate-y-2
          before:-z-10
          border-[3px]"
            >
              <div
                className={`w-3/4 h-full flex items-center justify-center ${
                  bgColors[index % bgColors.length]
                }`}
              >
                {loadingImages[index] ? (
                  <div className="w-16 h-16 bg-gray-300 rounded-lg animate-pulse flex items-center justify-center">
                    <span className="text-xs text-gray-600">...</span>
                  </div>
                ) : nftImages[index] ? (
                  <img
                    src={nftImages[index]}
                    alt={`${hunt.name} NFT`}
                    className="size-full object-cover rounded-lg border-2 border-white shadow-lg"
                    onError={(e) => {
                      // Fallback to icon if image fails to load
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                {/* Fallback icon - hidden by default, shown if no NFT image or if image fails */}
                <div className={`${nftImages[index] ? 'hidden' : ''} w-16 h-16 bg-white/20 rounded-lg border-2 border-white shadow-lg flex items-center justify-center`}>
                  {icons[index % icons.length]}
                </div>
              </div>

              <div className="w-3/4 p-5 flex flex-col justify-between ">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2 h-[32px] overflow-hidden">
                    {hunt.name}
                  </h2>
                  <p className="text-[0.85rem] text-gray-600 line-clamp-2">
                    {hunt.description}
                  </p>
                </div>

                <div className="mt-auto">
                  <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
                    <BsFillCalendarDateFill className="w-4 h-4" />
                    <span>
                      {new Date(
                        Number(hunt.startTime.toString().substring(0, 4)),
                        Number(hunt.startTime.toString().substring(4, 6)) - 1,
                        Number(hunt.startTime.toString().substring(6, 8))
                      ).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  {/* Single button that changes based on state */}
                  {buttonConfig.action === "register" ? (
                    <TransactionButton
                      contractAddress={contractAddress}
                      abi={huntABI}
                      functionName="registerForHunt"
                      args={[
                        originalIndex,
                        address || "0x0000000000000000000000000000000000000000",
                      ]}
                      text={buttonConfig.text}
                      className={`w-full py-1.5 text-sm font-medium rounded-md ${buttonConfig.className} transition-colors duration-300`}
                      disabled={
                        !address ||
                        isLoading ||
                        isCheckingRegistrations ||
                        buttonConfig.disabled
                      }
                      onError={(error) => console.log(error)}
                      onSuccess={(data) => handleRegisterSuccess(data, index)}
                    />
                  ) : (
                    <Button
                      onClick={() => {
                        if (buttonConfig.action === "start") {
                          handleHuntStart(
                            index,
                            originalIndex,
                            hunt.clues_blobId,
                            hunt.answers_blobId
                          );
                        }
                      }}
                      className={`w-full py-1.5 text-sm font-medium rounded-md ${buttonConfig.className} transition-colors duration-300`}
                      disabled={
                        !address ||
                        isLoading ||
                        isCheckingRegistrations ||
                        buttonConfig.disabled
                      }
                    >
                      {isCheckingRegistrations
                        ? "Checking..."
                        : buttonConfig.text}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
