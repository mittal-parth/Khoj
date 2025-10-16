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

// Parse enabled chains from env, fallback to all supported
const parseEnabledNetworks = () => {
  const raw = import.meta.env.VITE_ENABLED_CHAINS as string | undefined;
  if (!raw) return Object.keys(SUPPORTED_CHAINS);

  const requested = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const valid = requested.filter((key) => key in SUPPORTED_CHAINS);
  return valid.length > 0 ? valid : Object.keys(SUPPORTED_CHAINS);
};

export const ENABLED_NETWORKS = parseEnabledNetworks();

export const ENABLED_CHAINS = ENABLED_NETWORKS.reduce(
  (acc, key) => {
    acc[key as keyof typeof SUPPORTED_CHAINS] = SUPPORTED_CHAINS[
      key as keyof typeof SUPPORTED_CHAINS
    ];
    return acc;
  },
  {} as Partial<typeof SUPPORTED_CHAINS>
);

export const ENABLED_CHAINS_ARRAY = ENABLED_NETWORKS.map(
  (key) => SUPPORTED_CHAINS[key as keyof typeof SUPPORTED_CHAINS]
);

// Helper function to get chain by network name
export const getChainByNetwork = (networkName: string) => {
  const fromEnabled = ENABLED_CHAINS[
    networkName as keyof typeof ENABLED_CHAINS
  ];
  if (fromEnabled) return fromEnabled;

  const fromSupported = SUPPORTED_CHAINS[
    networkName as keyof typeof SUPPORTED_CHAINS
  ];
  if (fromSupported) return fromSupported;

  // Default to first enabled, falling back to moonbaseAlpha
  const firstEnabled = ENABLED_CHAINS_ARRAY[0];
  return firstEnabled || moonbaseAlpha;
};

// Helper function to get network name by chain ID
export const getNetworkByChainId = (chainId: number): string | undefined => {
  const chainIdMap: Record<number, string> = {
    [baseSepolia.id]: "base",
    [moonbaseAlpha.id]: "moonbeam",
    [paseoAssetHub.id]: "assetHub",
    [flowTestnet.id]: "flow",
  };
  
  return chainIdMap[chainId];
};

// Helper function to check if network supports contracts (base and moonbeam do)
export const isContractSupportedNetwork = (networkName: string) => {
  return networkName === "base" || networkName === "moonbeam";
};

// Helper function to get current network from localStorage with fallback
export const getCurrentNetwork = () => {
  const stored = localStorage.getItem("current_network");
  if (stored && ENABLED_CHAINS[stored as keyof typeof ENABLED_CHAINS]) {
    return stored;
  }
  return ENABLED_NETWORKS[0] || "moonbeam";
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
  const chain =
    ENABLED_CHAINS[network as keyof typeof ENABLED_CHAINS] ||
    SUPPORTED_CHAINS[network as keyof typeof SUPPORTED_CHAINS];
  return chain.id;
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
