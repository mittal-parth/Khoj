import type { ReactNode } from "react";
import { ThirdwebProvider } from "thirdweb/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HuddleProvider } from "./contexts/HuddleContext";

const queryClient = new QueryClient();

export function Providers(props: { children: ReactNode }) {
  return (
    <ThirdwebProvider>
      <QueryClientProvider client={queryClient}>
        <HuddleProvider>
          {props.children}
        </HuddleProvider>
      </QueryClientProvider>
    </ThirdwebProvider>
  );
}
