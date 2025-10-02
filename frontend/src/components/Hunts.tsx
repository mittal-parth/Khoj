import { TbLadder, TbChessKnight, TbUsersGroup } from "react-icons/tb";
import { FaChess, FaDice } from "react-icons/fa";
import { BsCalendar2DateFill } from "react-icons/bs";
import { IoIosPeople } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { useActiveAccount, useReadContract } from "thirdweb/react";
import { getContract } from "thirdweb";
import { huntABI } from "../assets/hunt_abi.ts";
import { toast } from "sonner";

import { TransactionButton } from "./TransactionButton";
import { Button } from "./ui/button.tsx";
import { Loader } from "./ui/loader";
import { useState, useEffect, useMemo } from "react";
import { useNetworkState } from "../lib/utils";
import { client } from "../lib/client";
import { Hunt, bgColorClasses, textColorClasses, bgColors } from "../types";
import { buttonStyles } from "../lib/styles.ts";



// Type guard to ensure address is a valid hex string
function isValidHexAddress(address: string): address is `0x${string}` {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

// Helper function to format date range
function formatDateRange(startTime: bigint, endTime: bigint): string {
  const startDate = new Date(Number(startTime) * 1000);
  const endDate = new Date(Number(endTime) * 1000);
  
  // If same day, show time range
  if (startDate.toDateString() === endDate.toDateString()) {
    return `${startDate.toLocaleDateString([], { month: 'short', day: 'numeric' })} • ${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  // Different days, show date range with times
  return `${startDate.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

export function Hunts() {
  const account = useActiveAccount();
  const address = account?.address;
  const navigate = useNavigate();
  // Track registration status per hunt (true if registered, false if not)
  const [huntRegistrations, setHuntRegistrations] = useState<
    Record<number, boolean>
  >({});
  const [isCheckingRegistrations, setIsCheckingRegistrations] = useState(false);

  // Feature flag for hunt filtering - controlled by environment variable
  const enableHuntFiltering = import.meta.env.VITE_ENABLE_HUNT_FILTERING === 'true';

  // Use the reactive network state hook
  const { currentNetwork, contractAddress: rawContractAddress, chainId, currentChain } = useNetworkState();

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
      chain: currentChain,
      address: contractAddress,
      abi: huntABI,
    });
  }, [rawContractAddress, currentChain]);

  // Call hooks at the top level
  const { data: huntsData = [], error: huntsError, isLoading: huntsLoading } = useReadContract({
    contract: contract!,
    method: "getAllHunts",
    params: [],
  });

  // Cast to Hunt type to include participants field
  const hunts = huntsData as Hunt[];

  const { data: nftContractAddress } = useReadContract({
    contract: contract!,
    method: "nftContract",
    params: [],
  });

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
    const checkRegistrationStatus = () => {
      if (!address || !processedHunts.length) return;

      setIsCheckingRegistrations(true);
      const registrationStatus: Record<number, boolean> = {};

      try {
        // Check registration status by looking at the participants array
        processedHunts.forEach((hunt) => {
          // Find the original index for this hunt to use as the key
          const originalIndex = hunts.findIndex(h => h === hunt);
          if (originalIndex !== -1) {
            // Check if the current user's address is in the participants array
            // If participants array doesn't exist, fall back to false
            const isRegistered = hunt.participants?.includes(address) ?? false;
            registrationStatus[originalIndex] = isRegistered;
          }
        });

        setHuntRegistrations(registrationStatus);
      } catch (error) {
        console.error("Error checking registration status:", error);
      } finally {
        setIsCheckingRegistrations(false);
      }
    };

    checkRegistrationStatus();
  }, [address, processedHunts, hunts]);

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
  // chainId is now provided by useNetworkState hook

  console.log("Hunts: chainId", chainId);
  console.log("Hunts: contractAddress", rawContractAddress);
  console.log("NFT Contract Address:", nftContractAddress);


  const handleRegisterSuccess = (data: any, originalHuntIndex: number) => {
    console.log("Register success: ", data);
    toast.success("Successfully registered for hunt!");

    // Update registration status for this specific hunt using the original index
    setHuntRegistrations((prev) => ({
      ...prev,
      [originalHuntIndex]: true,
    }));

    // give a little delay
    setTimeout(() => {
      navigate(`/hunt/${originalHuntIndex}`);
    }, 2000);
    // Note: The participants array will be updated when the component re-renders
    // and fetches fresh data from the contract, so no need to manually update it here
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

  const today = Math.floor(Date.now() / 1000);

  console.log("today", today);
  console.log("reg", huntRegistrations);

  // Show loading state while hunts are being fetched
  if (huntsLoading) {
    return (
      <div className="pt-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-[90px]">
        <h1 className="text-3xl font-bold mt-12 mb-6 mx-2 text-green drop-shadow-xl">
          Hunts
        </h1>
        <Loader 
          text="Loading Treasure Hunts..." 
          subtext="Fetching the latest adventures for you..."
          showAnimation={true}
        />
      </div>
    );
  }

  // Array of background colors and icons to rotate through

  const icons = [
    <TbLadder className="w-10 h-10 text-white" />,
    <TbChessKnight className="w-10 h-10 text-white" />,
    <FaChess className="w-10 h-10 text-white" />,
    <FaDice className="w-10 h-10 text-white" />,
  ];

  // Function to get button text and action based on hunt state
  const getButtonConfig = (hunt: Hunt, index: number) => {
    const huntEndTime = Number(hunt.endTime);
    const isHuntStarted = true;
    const isRegistered = huntRegistrations[index];
    const isHuntEnded = huntEndTime < today;

    if (isHuntEnded) {
      return {
        text: "Ended",
        disabled: true,
        className: buttonStyles.disabled,
        action: null,
      };
    }

    if (!isHuntStarted) {
      return {
        text: "Coming Soon",
        disabled: true,
        className: buttonStyles.disabled,
        action: null,
      };
    }

    if (!isRegistered) {
      return {
        text: "Register",
        disabled: false,
        className: buttonStyles.secondary,
        action: "register",
      };
    }

    return {
      text: "Manage",
      disabled: false,
      className: buttonStyles.primary,
      action: "manage",
    };
  };

  return (
    <div className="pt-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-[90px]">
      <h1 className="text-3xl font-bold mt-12 mb-6 mx-2 text-green drop-shadow-xl">
        Hunts
      </h1>
      
      {processedHunts.length === 0 ? (
        <Loader 
          text="No Treasure Hunts Yet! 🗺️" 
          subtext="The treasure map is empty, but adventure awaits! Check back soon for exciting hunts to embark upon."
          showAnimation={false}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mx-2">
          {processedHunts.map((hunt: Hunt, index: number) => {
          // Find the original index for contract interactions
          const originalIndex = hunts.findIndex(h => h === hunt);
          const buttonConfig = getButtonConfig(hunt, originalIndex);

          return (
            <div
              key={originalIndex}
              className="flex 
            bg-white rounded-lg
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
                className={`w-1/4 flex items-center justify-center ${
                  bgColorClasses[bgColors[index % bgColors.length] as keyof typeof bgColorClasses]
                }`}
              >
                {icons[index % icons.length]}
              </div>

              <div className="w-3/4 p-5 flex flex-col justify-between">
                {/* Header with title and teams pill */}
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-semibold text-gray-800 flex-1 pr-2 leading-tight">
                    {hunt.name}
                  </h2>
                  {hunt.teamsEnabled && (
                    <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                      <TbUsersGroup className="w-3 h-3" />
                      <span>Teams</span>
                    </div>
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-3">
                  {hunt.description}
                </p>

                {/* Date and time information */}
                <div className="flex items-center gap-1 text-sm mb-3">
                  <BsCalendar2DateFill className={`w-4 h-4 ${textColorClasses[bgColors[index % bgColors.length] as keyof typeof textColorClasses]} mr-0.5`} />
                  <span className="text-sm">
                    {formatDateRange(hunt.startTime, hunt.endTime)}
                  </span>
                </div>

                {/* Participant count */}
                <div className="flex items-center gap-1 text-sm mb-3">
                  <IoIosPeople className={`w-5 h-5 ${textColorClasses[bgColors[index % bgColors.length] as keyof typeof textColorClasses]}`} />
                  <span className="text-sm">
                    {Number(hunt.participantCount)} participant{hunt.participantCount !== 1n ? 's' : ''}
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
                      isCheckingRegistrations ||
                      buttonConfig.disabled
                    }
                    onError={(error) => console.log(error)}
                    onSuccess={(data) => handleRegisterSuccess(data, originalIndex)}
                  />
                ) : (
                  <Button
                    onClick={() => {
                      if (buttonConfig.action === "manage") {
                        navigate(`/hunt/${originalIndex}`);
                      }
                    }}
                    className={`w-full py-1.5 text-sm font-medium rounded-md ${buttonConfig.className} transition-colors duration-300`}
                    disabled={
                      !address ||
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
          );
        })}
        </div>
      )}
    </div>
  );
}
