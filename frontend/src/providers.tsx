import type { ReactNode } from "react";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { useWagmiConfig } from "./lib/wagmi";
import { SUPPORTED_CHAINS, paseoAssetHub } from "./lib/utils";

const queryClient = new QueryClient();

export function Providers(props: { children: ReactNode }) {
  const wagmiConfig = useWagmiConfig();

  const currentNetwork = localStorage.getItem("current_network") || "assetHub";
  const currentChain = paseoAssetHub; // Always use AssetHub chain

  return (
    <OnchainKitProvider
      apiKey={import.meta.env.VITE_PUBLIC_ONCHAINKIT_API_KEY}
      chain={currentChain}
    >
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          {props.children}
        </QueryClientProvider>
      </WagmiProvider>
    </OnchainKitProvider>
  );
}
