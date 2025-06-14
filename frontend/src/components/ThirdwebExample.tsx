"use client";

import {
  ConnectButton,
  useActiveAccount,
  useActiveWallet,
} from "thirdweb/react";
import { sendTransaction, prepareTransaction } from "thirdweb";
import { client } from "../lib/client";
import { paseoAssetHub } from "../lib/chains";
import { useState } from "react";

export default function ThirdwebExample() {
  return (
    <main className="p-4 pb-10 min-h-[100vh] flex items-center justify-center container max-w-screen-lg mx-auto">
      <div className="py-20">
        <Header />

        <div className="flex justify-center mb-20">
          <ConnectButton
            client={client}
            chains={[paseoAssetHub]}
            appMetadata={{
              name: "ETHunt",
              url: "https://ethunt.vercel.app",
            }}
          />
        </div>

        <TransactionTester />

        <ThirdwebResources />
      </div>
    </main>
  );
}

function Header() {
  return (
    <header className="flex flex-col items-center mb-20 md:mb-20">
      <div className="size-[150px] md:size-[150px] bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-6">
        <span className="text-white text-4xl font-bold">TW</span>
      </div>

      <h1 className="text-2xl md:text-6xl font-semibold md:font-bold tracking-tighter mb-6 text-zinc-100">
        thirdweb SDK
        <span className="text-zinc-300 inline-block mx-1"> + </span>
        <span className="inline-block -skew-x-6 text-blue-500"> React </span>
      </h1>

      <p className="text-zinc-300 text-base">
        ETHunt powered by{" "}
        <code className="bg-zinc-800 text-zinc-300 px-2 rounded py-1 text-sm mx-1">
          thirdweb
        </code>{" "}
        SDK.
      </p>
    </header>
  );
}

function TransactionTester() {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [txResult, setTxResult] = useState<string>("");

  const handleTestTransaction = async () => {
    if (!account || !wallet) {
      alert("Please connect your wallet first");
      return;
    }

    setIsLoading(true);
    setTxResult("");

    try {
      // Prepare a simple test transaction (sending 0.001 PAS to yourself)
      const transaction = prepareTransaction({
        to: account.address,
        value: BigInt("1000000000000000"), // 0.001 PAS in wei
        chain: paseoAssetHub,
        client: client,
      });

      // Send the transaction
      const result = await sendTransaction({
        transaction,
        account,
      });

      setTxResult(`Transaction successful! Hash: ${result.transactionHash}`);
      console.log("Transaction result:", result);
    } catch (error) {
      console.error("Transaction failed:", error);
      setTxResult(
        `Transaction failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="flex justify-center mb-20">
        <p className="text-zinc-400">
          Connect your wallet to test transactions
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center mb-20 space-y-4">
      <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4 text-center">
          Test Transaction
        </h3>

        <div className="mb-4">
          <p className="text-sm text-zinc-400 mb-2">Connected Account:</p>
          <p className="text-xs font-mono bg-zinc-800 p-2 rounded break-all">
            {account.address}
          </p>
        </div>

        <div className="mb-4">
          <p className="text-sm text-zinc-400 mb-2">Chain:</p>
          <p className="text-sm text-blue-400">{paseoAssetHub.name}</p>
        </div>

        <button
          onClick={handleTestTransaction}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white font-medium py-2 px-4 rounded transition-colors"
        >
          {isLoading
            ? "Signing Transaction..."
            : "Send Test Transaction (0.001 PAS)"}
        </button>

        {txResult && (
          <div className="mt-4 p-3 rounded bg-zinc-800 border border-zinc-700">
            <p className="text-xs text-zinc-300 break-all">{txResult}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ThirdwebResources() {
  return (
    <div className="grid gap-4 lg:grid-cols-3 justify-center">
      <ArticleCard
        title="thirdweb SDK Docs"
        href="https://portal.thirdweb.com/typescript/v5"
        description="thirdweb TypeScript SDK documentation"
      />

      <ArticleCard
        title="Components and Hooks"
        href="https://portal.thirdweb.com/typescript/v5/react"
        description="Learn about the thirdweb React components and hooks in thirdweb SDK"
      />

      <ArticleCard
        title="thirdweb Dashboard"
        href="https://thirdweb.com/dashboard"
        description="Deploy, configure, and manage your smart contracts from the dashboard."
      />
    </div>
  );
}

function ArticleCard(props: {
  title: string;
  href: string;
  description: string;
}) {
  return (
    <a
      href={props.href + "?utm_source=react-template"}
      target="_blank"
      className="flex flex-col border border-zinc-800 p-4 rounded-lg hover:bg-zinc-900 transition-colors hover:border-zinc-700"
    >
      <article>
        <h2 className="text-lg font-semibold mb-2">{props.title}</h2>
        <p className="text-sm text-zinc-400">{props.description}</p>
      </article>
    </a>
  );
}
