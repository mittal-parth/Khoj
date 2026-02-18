import { baseSepolia, moonbaseAlpha, paseoAssetHub, flowTestnet } from "./chains";

/**
 * Paymaster Configuration for Gas Sponsorship
 * 
 * This module defines which chains support gas sponsorship through Thirdweb's
 * paymaster infrastructure. Gas sponsorship allows users to transact without
 * needing native tokens to pay for gas fees.
 * 
 * Supported chains for gas sponsorship:
 * - Base Sepolia: Full support via Thirdweb Engine Paymaster
 * - Moonbase Alpha: Full support via Thirdweb Engine Paymaster
 * - Flow Testnet: May have limited support
 * - PAsset Hub: Custom chain - may require EIP-4337 or custom logic
 */

export const PAYMASTER_SUPPORTED_CHAINS = {
  [baseSepolia.id]: true,
  [moonbaseAlpha.id]: true,
  [flowTestnet.id]: false, // Check Thirdweb dashboard for support
  [paseoAssetHub.id]: false, // Custom chain - may need custom paymaster
} as const;

export const isPaymasterSupported = (chainId: number): boolean => {
  return PAYMASTER_SUPPORTED_CHAINS[chainId as keyof typeof PAYMASTER_SUPPORTED_CHAINS] ?? false;
};

export const getPaymasterSupportedChains = () => {
  return Object.entries(PAYMASTER_SUPPORTED_CHAINS)
    .filter(([, supported]) => supported)
    .map(([chainId]) => Number(chainId));
};

/**
 * Smart Wallet configuration for account abstraction
 * This enables sponsored transactions when sponsorGas is true
 */
export const getSmartWalletConfig = () => ({
  chain: baseSepolia, // Default chain for smart wallet
  sponsorGas: true, // Enable gas sponsorship through paymaster
});
