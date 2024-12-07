import { TrueApi, testnet } from "@truenetworkio/sdk";
import { TrueConfig } from "@truenetworkio/sdk/dist/utils/cli-config";
import { huntAttestationSchema } from "../src/schemas/huntSchema";
// If you are not in a NodeJS environment, please comment the code following code:
// import dotenv from "dotenv";
// dotenv.config();

export const getTrueNetworkInstance = async (): Promise<TrueApi> => {
  const trueApi = await TrueApi.create(config.account.secret);

  await trueApi.setIssuer(config.issuer.hash);

  return trueApi;
};

// const VITE_PUBLIC_NEXT_PUBLIC_TRUE_NETWORK_SECRET_KEY =
//   import.meta.env.VITE_PUBLIC_NEXT_PUBLIC_TRUE_NETWORK_SECRET_KEY ?? "";

export const config: TrueConfig = {
  network: testnet,
  account: {
    address: "jkJwhGbRf1n6jjbYMzkRJH8gXtrdLqpHynf4FaTm4kZpzfn",
    secret: import.meta.env.VITE_PUBLIC_TRUE_NETWORK_SECRET_KEY ?? "",
  },
  issuer: {
    name: "ethunt",
    hash: "0xba3f2d393c2f5aeefde67fb2947ca7df7be9e0e49e73cc5b59937a711f52178b",
  },
  algorithm: {
    id: 105,
    path: "acm",
    schemas: [huntAttestationSchema],
  },
};
