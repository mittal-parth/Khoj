import { ConnectButton, lightTheme } from "thirdweb/react";
import { client } from "../lib/client";
import { ENABLED_CHAINS_ARRAY } from "../lib/utils";
import { WalletWrapperParams } from "../types";

const customTheme = lightTheme({
  colors: {
    primaryButtonBg: "oklch(96.79% 0.0654 102.26)",
    primaryButtonText: "oklch(0% 0 0)",
    modalBg: "oklch(96.79% 0.0654 102.26)",
    borderColor: "oklch(0% 0 0)",
    separatorLine: "oklch(0% 0 0)",
    secondaryButtonBg: "oklch(96.79% 0.0654 102.26)",
    secondaryButtonText: "oklch(0% 0 0)",
    secondaryButtonHoverBg: "oklch(94% 0.0654 102.26)",
    connectedButtonBg: "oklch(96.79% 0.0654 102.26)",
    connectedButtonBgHover: "oklch(94% 0.0654 102.26)",
  },
});

export default function WalletWrapper({
  text,
}: WalletWrapperParams) {
  return (
    <ConnectButton
      client={client}
      chains={ENABLED_CHAINS_ARRAY}
      theme={customTheme}
      connectButton={{
        label: text || "Get Started",
        style: {
          border: '2px solid black',
          boxShadow: '-2px 2px 0px 0px rgba(0, 0, 0, 1)',
          borderRadius: '0.375rem',
          fontWeight: 'bold',
          padding: '0.5rem 0.75rem',
          fontSize: '0.875rem',
          transition: 'all 0.2s',
        },
      }}
      detailsButton={{
        style: {
          border: '2px solid black',
          boxShadow: '-2px 2px 0px 0px rgba(0, 0, 0, 1)',
          borderRadius: '0.375rem',
          fontWeight: 'bold',
          padding: '0.5rem 0.75rem',
          fontSize: '0.875rem',
          transition: 'all 0.2s',
        },
      }}
      appMetadata={{
        name: "Khoj",
        url: "https://playkhoj.com/",
      }}
    />
  );
}
