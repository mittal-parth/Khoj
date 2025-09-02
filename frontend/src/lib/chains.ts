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
