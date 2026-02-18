import { ConnectButton, lightTheme } from "thirdweb/react";
import { inAppWallet, createWallet } from "thirdweb/wallets";
import { client } from "../lib/client";
import { ENABLED_CHAINS_ARRAY } from "../lib/utils";
import { baseSepolia } from "../lib/chains";
import { WalletWrapperParams } from "../types";

const customTheme = lightTheme({
  colors: {
    primaryButtonBg: "oklch(96.79% 0.0654 102.26)",
    primaryButtonText: "oklch(0% 0 0)",
    modalBg: "oklch(96.79% 0.0654 102.26)",
    borderColor: "oklch(0% 0 0)",
    separatorLine: "oklch(0% 0 0)",
    secondaryButtonBg: "oklch(96.79% 0.0654 102.26)",
    secondaryButtonText: "oklch(0% 0 0)",
    secondaryButtonHoverBg: "oklch(94% 0.0654 102.26)",
    connectedButtonBg: "oklch(96.79% 0.0654 102.26)",
    connectedButtonBgHover: "oklch(94% 0.0654 102.26)",
  },
});

/**
 * Wallet configuration with Smart Account for gas sponsorship
 * 
 * The inAppWallet with smartAccount configuration enables:
 * - Social login (Google, Apple, etc.)
 * - Email/phone authentication
 * - Gas-free transactions via paymaster on supported chains
 * 
 * Supported chains for gas sponsorship:
 * - Base Sepolia (chain ID: 84532)
 * - Moonbase Alpha (chain ID: 1287)
 */
const wallets = [
  inAppWallet({
    auth: {
      options: [
        "google",
        "apple",
        "email",
        "phone",
        "passkey",
      ],
    },
    smartAccount: {
      chain: baseSepolia,
      sponsorGas: true,
    },
  }),
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("me.rainbow"),
  createWallet("io.rabby"),
];

/**
 * Account abstraction configuration for gas sponsorship
 * This enables sponsored transactions on supported chains
 */
const accountAbstraction = {
  chain: baseSepolia,
  sponsorGas: true,
};

export default function WalletWrapper({
  text,
}: WalletWrapperParams) {
  return (
    <ConnectButton
      client={client}
      wallets={wallets}
      chains={ENABLED_CHAINS_ARRAY}
      accountAbstraction={accountAbstraction}
      theme={customTheme}
      connectButton={{
        label: text || "Get Started",
        style: {
          border: '2px solid black',
          boxShadow: '-2px 2px 0px 0px rgba(0, 0, 0, 1)',
          borderRadius: '0.375rem',
          fontWeight: 'bold',
          padding: '0.5rem 0.75rem',
          fontSize: '0.875rem',
          transition: 'all 0.2s',
        },
      }}
      detailsButton={{
        style: {
          border: '2px solid black',
          boxShadow: '-2px 2px 0px 0px rgba(0, 0, 0, 1)',
          borderRadius: '0.375rem',
          fontWeight: 'bold',
          padding: '0.5rem 0.75rem',
          fontSize: '0.875rem',
          transition: 'all 0.2s',
        },
      }}
      appMetadata={{
        name: "Khoj",
        url: "https://playkhoj.com/",
      }}
    />
  );
}
