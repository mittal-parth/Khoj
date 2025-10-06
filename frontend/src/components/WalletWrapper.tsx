import { ConnectButton } from "thirdweb/react";
import { client } from "../lib/client";
import { paseoAssetHub, baseSepolia, moonbaseAlpha, flowTestnet } from "../lib/chains";
import { WalletWrapperParams } from "../types";


export default function WalletWrapper({
  className,
  text,
}: WalletWrapperParams) {
  return (
    <ConnectButton
      client={client}
      chains={[paseoAssetHub, baseSepolia, moonbaseAlpha, flowTestnet]}
      connectButton={{
        label: text || "Get Started",
        className: className,
      }}
      appMetadata={{
        name: "Khoj",
        url: "https://khoj-app.vercel.app",
      }}
    />
  );
}
