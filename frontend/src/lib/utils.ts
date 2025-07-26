import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { defineChain } from "viem";
import { baseSepolia } from "wagmi/chains";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CONTRACT_ADDRESSES = {
  moonbeam: import.meta.env.VITE_PUBLIC_MOONBEAM_CONTRACT_ADDRESS,
  base: import.meta.env.VITE_PUBLIC_BASE_CONTRACT_ADDRESS,
  assetHub: import.meta.env.VITE_PUBLIC_ASSET_HUB_CONTRACT_ADDRESS,
} as const;

export const paseoAssetHub = defineChain({
  id: 420420422,
  name: "PAssetHub - Contracts Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Pas Tokens",
    symbol: "PAS",
  },
  rpcUrls: {
    default: {
      http: ["https://testnet-passet-hub-eth-rpc.polkadot.io/"],
    },
  },
  blockExplorers: {
    default: {
      name: "SubScan",
      url: "https://blockscout-passet-hub.parity-testnet.parity.io/",
    },
  },
  testnet: true,
});

export const SUPPORTED_CHAINS = {
  // moonbeam: moonbaseAlpha,
  // base: baseSepolia,
  assetHub: paseoAssetHub,
};
