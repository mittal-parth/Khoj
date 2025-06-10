import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { baseSepolia, moonbaseAlpha } from "wagmi/chains";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const CONTRACT_ADDRESSES = {
  moonbeam: import.meta.env.VITE_PUBLIC_MOONBEAM_CONTRACT_ADDRESS,
  base: import.meta.env.VITE_PUBLIC_BASE_CONTRACT_ADDRESS,
} as const;

export const SUPPORTED_CHAINS = {
  moonbeam: moonbaseAlpha,
  base: baseSepolia,
};