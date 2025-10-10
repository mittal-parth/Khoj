import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useState, useEffect } from "react";
import { paseoAssetHub, baseSepolia, moonbaseAlpha, flowTestnet } from "./chains";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CONTRACT_ADDRESSES = {
  moonbeam: import.meta.env.VITE_PUBLIC_MOONBASE_ALPHA_CONTRACT_ADDRESS,
  base: import.meta.env.VITE_PUBLIC_BASE_CONTRACT_ADDRESS,
  assetHub: import.meta.env.VITE_PUBLIC_ASSET_HUB_CONTRACT_ADDRESS,
  flow: import.meta.env.VITE_PUBLIC_FLOW_CONTRACT_ADDRESS,
} as const;


export const SUPPORTED_CHAINS = {
  moonbeam: moonbaseAlpha,
  base: baseSepolia,
  assetHub: paseoAssetHub,
  flow: flowTestnet,
};

// Helper function to get chain by network name
export const getChainByNetwork = (networkName: string) => {
  const chainMap: Record<string, any> = {
    base: baseSepolia,
    moonbeam: moonbaseAlpha,
    assetHub: paseoAssetHub,
    flow: flowTestnet,
  };
  
  return chainMap[networkName] || moonbaseAlpha; // Default to moonbaseAlpha
};

// Helper function to check if network supports contracts (base and moonbeam do)
export const isContractSupportedNetwork = (networkName: string) => {
  return networkName === "base" || networkName === "moonbeam";
};

// Helper function to get current network from localStorage with fallback
export const getCurrentNetwork = () => {
  return localStorage.getItem("current_network") || "moonbeam";
};

// Helper function to get contract address for current network
export const getContractAddress = (networkName?: string) => {
  const network = networkName || getCurrentNetwork();
  const address = CONTRACT_ADDRESSES[network as keyof typeof CONTRACT_ADDRESSES];
  
  // Check if the environment variable is undefined or empty
  if (!address || address === "undefined" || address === "") {
    console.warn(`Contract address not configured for network: ${network}`);
    return "0x0000000000000000000000000000000000000000";
  }
  
  return address;
};

// Helper function to get chain ID for current network
export const getChainId = (networkName?: string) => {
  const network = networkName || getCurrentNetwork();
  return SUPPORTED_CHAINS[network as keyof typeof SUPPORTED_CHAINS].id;
};

// Custom hook to reactively get network values
export const useNetworkState = () => {
  const [currentNetwork, setCurrentNetwork] = useState(getCurrentNetwork());
  const [contractAddress, setContractAddress] = useState(getContractAddress(currentNetwork));
  const [chainId, setChainId] = useState(getChainId(currentNetwork));

  useEffect(() => {
    const handleStorageChange = () => {
      const newNetwork = getCurrentNetwork();
      setCurrentNetwork(newNetwork);
      setContractAddress(getContractAddress(newNetwork));
      setChainId(getChainId(newNetwork));
    };

    // Listen for storage changes (for cross-tab changes)
    window.addEventListener('storage', handleStorageChange);
    
    // Also check for changes periodically (for same-tab changes)
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return {
    currentNetwork,
    contractAddress,
    chainId,
    currentChain: getChainByNetwork(currentNetwork)
  };
};
