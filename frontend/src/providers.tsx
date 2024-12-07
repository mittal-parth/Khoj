import type { ReactNode } from "react";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { baseSepolia, moonbaseAlpha, bscTestnet } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { useWagmiConfig } from "./lib/wagmi";

const queryClient = new QueryClient();

export const SUPPORTED_CHAINS = {
  moonbeam: moonbaseAlpha,
  bnb: bscTestnet,
  base: baseSepolia,
} as const;

export function Providers(props: { children: ReactNode }) {
  const wagmiConfig = useWagmiConfig();

  const currentNetwork = localStorage.getItem("current_network") || "base";
  const currentChain =
    SUPPORTED_CHAINS[currentNetwork as keyof typeof SUPPORTED_CHAINS];

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
