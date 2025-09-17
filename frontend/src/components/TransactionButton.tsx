import { useState } from "react";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { prepareContractCall } from "thirdweb";
import { client } from "../lib/client";
import { useNetworkState } from "../lib/utils";
import { Button } from "./ui/button";
import { TransactionButtonProps } from "../types";


export function TransactionButton({
  contractAddress,
  abi,
  functionName,
  args,
  text,
  className,
  disabled,
  onSuccess,
  onError,
  onClick,
}: TransactionButtonProps) {
  const account = useActiveAccount();
  const { mutate: sendTransaction, isPending } = useSendTransaction();
  const [isLoading, setIsLoading] = useState(false);
  
  // Get current chain from reactive network state
  const { currentChain } = useNetworkState();

  const handleTransaction = async () => {
    if (!account) {
      onError?.({ message: "Please connect your wallet first" });
      return;
    }

    // Call the onClick handler for validation
    if (onClick && onClick() === false) {
      return; // Stop if validation fails
    }

    setIsLoading(true);

    try {
      const transaction = prepareContractCall({
        contract: {
          address: contractAddress as `0x${string}`,
          abi,
          chain: currentChain,
          client,
        },
        method: functionName,
        params: args,
      });

      sendTransaction(transaction, {
        onSuccess: (result) => {
          setIsLoading(false);
          onSuccess?.(result);
        },
        onError: (error) => {
          setIsLoading(false);
          onError?.(error);
        },
      });
    } catch (error) {
      setIsLoading(false);
      onError?.(error);
    }
  };

  return (
    <Button
      onClick={handleTransaction}
      className={className}
      disabled={disabled || isLoading || isPending}
    >
      {isLoading || isPending ? "Processing..." : text}
    </Button>
  );
}
