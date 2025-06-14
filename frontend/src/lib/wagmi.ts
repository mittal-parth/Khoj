"use client";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { coinbaseWallet } from "@rainbow-me/rainbowkit/wallets";
import { useMemo } from "react";
import { http, createConfig } from "wagmi";
import { paseoAssetHub } from "./utils";

export function useWagmiConfig() {
  const projectId = "03a874ead074383e90ef9c7198c513d9";
  if (!projectId) {
    const providerErrMessage =
      "To connect to all Wallets you need to provide a NEXT_PUBLIC_WC_PROJECT_ID env variable";
    throw new Error(providerErrMessage);
  }

  return useMemo(() => {
    const connectors = connectorsForWallets(
      [
        {
          groupName: "Recommended Wallet",
          wallets: [coinbaseWallet],
        },
      ],
      {
        appName: "onchainkit",
        projectId,
      }
    );

    const wagmiConfig = createConfig({
      chains: [paseoAssetHub],
      // turn off injected provider discovery
      multiInjectedProviderDiscovery: false,
      connectors,
      ssr: true,
      transports: {
        [paseoAssetHub.id]: http(
          "https://testnet-passet-hub-eth-rpc.polkadot.io/"
        ),
      },
    });

    return wagmiConfig;
  }, [projectId]);
}
