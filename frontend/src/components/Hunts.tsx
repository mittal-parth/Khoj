import { TbLadder, TbChessKnight } from "react-icons/tb";
import { FaChess, FaDice } from "react-icons/fa";
import { BsFillCalendarDateFill } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import { useAccount, useReadContract, usePublicClient } from "wagmi";
import { huntABI } from "../assets/hunt_abi.ts";
import { type Abi } from "viem";
import { toast } from "sonner";

import { useClaudeRiddles } from "@/hooks/useClaudeRiddles";
import {
  Transaction,
  TransactionButton,
} from "@coinbase/onchainkit/transaction";
import { Button } from "./ui/button.tsx";
import { useState } from "react";
import { SUPPORTED_CHAINS, CONTRACT_ADDRESSES } from "../lib/utils";

interface Hunt {
  name: string;
  description: string;
  startTime: bigint;
  duration: bigint;
  participantCount: bigint;
  clues_blobId: string;
  answers_blobId: string;
}

// Add type assertion for the ABI
const typedHuntABI = huntABI as Abi;

const BACKEND_URL = import.meta.env.VITE_PUBLIC_BACKEND_URL;

// Type guard to ensure address is a valid hex string
function isValidHexAddress(address: string): address is `0x${string}` {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

export function Hunts() {
  const { address } = useAccount();
  const navigate = useNavigate();
  const [currentHuntId, setCurrentHuntId] = useState<number>(0);
  const [isRegistered, setIsRegistered] = useState(false);
  const { fetchRiddles, isLoading } = useClaudeRiddles(currentHuntId);
  const publicClient = usePublicClient();

  // Add this to get current network from localStorage
  const currentNetwork = localStorage.getItem("current_network") || "assetHub";
  const rawContractAddress =
    CONTRACT_ADDRESSES[currentNetwork as keyof typeof CONTRACT_ADDRESSES] ??
    "0x0000000000000000000000000000000000000000";

  // Call hooks at the top level
  const { data: hunts = [], error: huntsError } = useReadContract({
    address: rawContractAddress as `0x${string}`,
    abi: typedHuntABI,
    functionName: "getAllHunts",
    args: [],
  }) as { data: Hunt[]; error: Error | null };

  const { data: nftContractAddress } = useReadContract({
    address: rawContractAddress as `0x${string}`,
    abi: typedHuntABI,
    functionName: "nftContract",
    args: [],
  });

  if (!isValidHexAddress(rawContractAddress)) {
    toast.error("Invalid contract address format");
    return null;
  }

  const contractAddress = rawContractAddress as `0x${string}`;

  if (contractAddress === "0x0000000000000000000000000000000000000000") {
    toast.error("Contract address not found for the selected network");
    return null;
  }

  //get the token getTokenId
  const chainId =
    SUPPORTED_CHAINS[currentNetwork as keyof typeof SUPPORTED_CHAINS].id;

  console.log("Hunts: chainId", chainId);
  console.log("Hunts: contractAddress", contractAddress);
  console.log("NFT Contract Address:", nftContractAddress);

  const handleHuntStart = async (
    huntId: number,
    clues_blobId: string,
    answers_blobId: string
  ) => {
    if (!publicClient) {
      console.error("Public client not initialized");
      return;
    }

    const tokenId = await publicClient.readContract({
      address: contractAddress,
      abi: huntABI,
      functionName: "getTokenId",
      args: [BigInt(huntId), address],
    });

    if (tokenId === 0n) {
      toast.error(
        "You are not eligible for this hunt. Please register or check the requirements."
      );
      return;
    }

    console.log("Hunt ID:", huntId, clues_blobId, answers_blobId);
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

    await fetchRiddles(clues, huntId.toString());
    navigate(`/hunt/${huntId}/clue/1`);
  };

  const handleRegisterSuccess = (data: any) => {
    console.log("Register success: ", data);
    setIsRegistered(true);
  };

  // Add more detailed logging
  console.log("Contract Debug:", {
    contractAddress,
    chainId,
    currentNetwork,
    huntsError,
    hunts,
    abi: typedHuntABI.find(
      (item) => "name" in item && item.name === "getAllHunts"
    ),
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
  console.log("reg", isRegistered);

  // Array of background colors and icons to rotate through
  const bgColors = ["bg-green", "bg-orange", "bg-yellow", "bg-pink", "bg-red"];
  const icons = [
    <TbLadder className="w-10 h-10 text-white" />,
    <TbChessKnight className="w-10 h-10 text-white" />,
    <FaChess className="w-10 h-10 text-white" />,
    <FaDice className="w-10 h-10 text-white" />,
  ];

  return (
    <div className="pt-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-[90px]">
      <h1 className="text-3xl font-bold my-8 text-green drop-shadow-xl">
        Hunts
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {hunts.map((hunt: Hunt, index: number) => {
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
                className={`w-1/4 flex items-center justify-center ${
                  bgColors[index % bgColors.length]
                }`}
              >
                {icons[index % icons.length]}
              </div>

              <div className="w-3/4 p-5 flex flex-col justify-between">
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

                  <div className="flex flex-row gap-2">
                    <Transaction
                      calls={[
                        {
                          address: contractAddress,
                          abi: typedHuntABI,
                          functionName: "registerForHunt",
                          args: [
                            index,
                            address,
                            "https://ethunt.vercel.app/metadata.json",
                          ],
                        },
                      ]}
                      className=""
                      chainId={chainId}
                      onError={(error) => console.log(error)}
                      onSuccess={handleRegisterSuccess}
                    >
                      <TransactionButton
                        text={
                          new Date(Number(BigInt(hunt.startTime))).getTime() >
                          today
                            ? "Coming Soon"
                            : "Register"
                        }
                        className={`w-full py-1.5 text-sm font-medium rounded-md ${
                          new Date(Number(hunt.startTime)).getTime() <= today
                            ? "bg-yellow/40 border border-black text-black hover:bg-orange/90 "
                            : "bg-gray-300 cursor-not-allowed text-gray-500"
                        } transition-colors duration-300`}
                        disabled={
                          isLoading ||
                          new Date(Number(BigInt(hunt.startTime))).getTime() >
                            today
                        }
                      />
                    </Transaction>

                    <Button
                      onClick={() =>
                        handleHuntStart(
                          index,
                          hunt.clues_blobId,
                          hunt.answers_blobId
                        )
                      }
                      className="w-full py-1.5 text-sm font-medium rounded-md bg-green/40 border border-black text-black hover:bg-green/90 transition-colors duration-300"
                      disabled={isLoading}
                    >
                      Start Hunt
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
