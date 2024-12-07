import type { ReactNode } from 'react';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { baseSepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { useWagmiConfig } from './lib/wagmi';

const queryClient = new QueryClient();

export function Providers(props: { children: ReactNode }) {

  const wagmiConfig = useWagmiConfig();

  return (
    <OnchainKitProvider
      apiKey={import.meta.env.VITE_PUBLIC_ONCHAINKIT_API_KEY}
      chain={baseSepolia}
    >
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          {props.children}
        </QueryClientProvider>
      </WagmiProvider>
    </OnchainKitProvider>
  );
} 