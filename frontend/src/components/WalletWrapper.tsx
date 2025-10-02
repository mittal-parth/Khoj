import { ConnectButton } from "thirdweb/react";
import { client } from "../lib/client";
import { paseoAssetHub, baseSepolia, moonbaseAlpha } from "../lib/chains";
import { WalletWrapperParams } from "../types";


export default function WalletWrapper({
  className,
  text,
}: WalletWrapperParams) {
  return (
    <ConnectButton
      client={client}
      chains={[paseoAssetHub, baseSepolia, moonbaseAlpha]}
      connectButton={{
        label: text || "Connect Wallet",
        className: className,
      }}
      appMetadata={{
        name: "Khoj",
        url: "https://khoj-app.vercel.app",
      }}
    />
  );
}
