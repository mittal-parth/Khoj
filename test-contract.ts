import { createConfig, http } from "wagmi";
import { createPublicClient } from "viem";
import { huntABI } from "./frontend/src/assets/hunt_abi";

const contractAddress = "0x51D270fcB8FaAB54B574df93deB5395ea61E8a26";

// Create a wagmi config
const config = createConfig({
  chains: [
    {
      id: 420420422,
      name: "AssetHub",
      network: "assethub",
      nativeCurrency: {
        name: "ETH",
        symbol: "ETH",
        decimals: 18,
      },
      rpcUrls: {
        default: {
          http: ["https://testnet-passet-hub-eth-rpc.polkadot.io/"],
        },
        public: {
          http: ["https://testnet-passet-hub-eth-rpc.polkadot.io/"],
        },
      },
    },
  ],
  transports: {
    420420422: http(),
  },
});

async function testGetAllHunts() {
  try {
    console.log("Testing getAllHunts...");
    console.log("Contract Address:", contractAddress);

    const publicClient = createPublicClient({
      chain: config.chains[0],
      transport: http(),
    });

    const result = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: huntABI,
      functionName: "getAllHunts",
      args: [],
    });

    console.log("Result:", result);
  } catch (error) {
    console.error("Error:", error);
  }
}

testGetAllHunts();
