import { defineChain } from "thirdweb";
  
export const paseoAssetHub = defineChain({
  id: 420420422,
  name: "PAssetHub - Contracts Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Pas Tokens",
    symbol: "PAS",
  },
  rpc: "https://testnet-passet-hub-eth-rpc.polkadot.io/",
  blockExplorers: [
    {
      name: "SubScan",
      url: "https://blockscout-passet-hub.parity-testnet.parity.io/",
    },
  ],
  testnet: true,
});

export const baseSepolia = defineChain({
  id: 84532,
  name: "Base Sepolia",
  nativeCurrency: {
    decimals: 18,
    name: "Base Sepolia",
    symbol: "ETH",
  },
  rpc: "https://sepolia.base.org",
  blockExplorers: [{
      name: "BaseScan",
      url: "https://sepolia.basescan.org",
  }],
  testnet: true,
});

export const moonbaseAlpha = defineChain({
  id: 1287,
  name: "Moonbase Alpha",
  nativeCurrency: {
    decimals: 18,
    name: 'DEV',
    symbol: 'DEV',
  },
  rpc: "https://rpc.api.moonbase.moonbeam.network",
  blockExplorers: [{
      name: "Moonscan",
      url: "https://moonbase.moonscan.io",
  }],
  testnet: true,
});

export const flowTestnet = defineChain({
  id: 545,
  name: "Flow EVM Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Flow",
    symbol: "FLOW",
  },
  rpc: "https://testnet.evm.nodes.onflow.org",
  blockExplorers: [{
      name: "FlowScan",
      url: "https://evm-testnet.flowscan.io",
  }],
  testnet: true,
});