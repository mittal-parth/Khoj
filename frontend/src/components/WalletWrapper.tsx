import { ConnectButton } from "thirdweb/react";
import { client } from "../lib/client";
import { ENABLED_CHAINS_ARRAY } from "../lib/utils";
import { WalletWrapperParams } from "../types";


export default function WalletWrapper({
  className,
  text,
}: WalletWrapperParams) {
  return (
    <ConnectButton
      client={client}
      chains={ENABLED_CHAINS_ARRAY}
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
