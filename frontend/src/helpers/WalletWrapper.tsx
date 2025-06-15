import { ConnectButton } from "thirdweb/react";
import { client } from "../lib/client";
import { paseoAssetHub } from "../lib/chains";

type WalletWrapperParams = {
  text?: string;
  className?: string;
  withWalletAggregator?: boolean;
};

export default function WalletWrapper({
  className,
  text,
}: WalletWrapperParams) {
  return (
    <ConnectButton
      client={client}
      chains={[paseoAssetHub]}
      connectButton={{
        label: text || "Connect Wallet",
        className: className,
      }}
      appMetadata={{
        name: "ETHunt",
        url: "https://ethunt.vercel.app",
      }}
    />
  );
}
