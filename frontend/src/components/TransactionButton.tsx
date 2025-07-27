import { useState } from "react";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { prepareContractCall } from "thirdweb";
import { client } from "../lib/client";
import { paseoAssetHub } from "../lib/chains";
import { Button } from "./ui/button";

interface TransactionButtonProps {
  contractAddress: string;
  abi: any;
  functionName: string;
  args: any[];
  text: string;
  className?: string;
  disabled?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

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
}: TransactionButtonProps) {
  const account = useActiveAccount();
  const { mutate: sendTransaction, isPending } = useSendTransaction();
  const [isLoading, setIsLoading] = useState(false);

  const handleTransaction = async () => {
    if (!account) {
      onError?.({ message: "Please connect your wallet first" });
      return;
    }

    setIsLoading(true);

    try {
      const transaction = prepareContractCall({
        contract: {
          address: contractAddress as `0x${string}`,
          abi,
          chain: paseoAssetHub,
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
