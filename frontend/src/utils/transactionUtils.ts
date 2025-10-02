import { getRpcClient } from "thirdweb";
import { client } from "../lib/client";
import { withRetry } from "./retryUtils";

/**
 * Extract teamId from transaction logs by parsing the TeamCreated event
 * 
 * This function waits for a transaction to be mined and then extracts the teamId
 * from the TeamCreated event logs. This is much faster than waiting for the transaction
 * to be mined and then making a separate contract call to getParticipantTeamId.
 * 
 * Uses the shared retry logic from retryUtils for robust transaction receipt fetching.
 * 
 * @param transactionHash - The hash of the transaction to analyze
 * @param contractAddress - The address of the contract that emitted the event
 * @param chain - The blockchain chain configuration
 * @returns Promise<string> - The extracted teamId as a string
 * @throws Error if transaction receipt is not available or teamId cannot be extracted
 * 
 * @example
 * ```typescript
 * const teamId = await extractTeamIdFromTransactionLogs(
 *   '0x1234567890abcdef...',
 *   '0xabcdef1234567890...',
 *   currentChain
 * );
 * console.log('Extracted teamId:', teamId); // "5"
 * ```
 */
export async function extractTeamIdFromTransactionLogs(
  transactionHash: string,
  contractAddress: string,
  chain: any
): Promise<string> {
  console.log("🔍 Extracting teamId from transaction logs...");
  
  // Get the RPC client to manually fetch the transaction receipt
  const rpcClient = getRpcClient({ client, chain });
  
  // Wait for the transaction receipt using RPC call with retry logic
  const receipt = await withRetry(
    async () => {
      console.log(`🔍 Fetching transaction receipt for: ${transactionHash}`);
      const result = await rpcClient({
        method: "eth_getTransactionReceipt",
        params: [transactionHash as `0x${string}`],
      });
      
      
      if (!result) {
        throw new Error("temporarily unavailable: Transaction receipt not available yet - transaction may not be mined");
      }
      
      return result;
    },
    {
      maxRetries: 5, // Increase retries for transaction mining
      initialDelay: 2000, // Start with 2 seconds delay
      onRetry: (attempt, error) => {
        console.log(`⏳ Attempt ${attempt}: Transaction not mined yet, retrying in 2 seconds...`);
        console.log("Retry reason:", error.message);
      }
    }
  );
  
  console.log("📋 Transaction receipt received:", receipt);
  
  // Extract teamId from the TeamCreated event logs
  // The TeamCreated event has signature: TeamCreated(uint256 indexed teamId, address indexed owner, uint256 maxMembers)
  // We'll look for logs from our contract with the right structure
  
  // Find the TeamCreated event in the logs
  let teamId: string | null = null;
  for (const log of receipt.logs) {
    // Check if this log is from our contract
    if (log.address.toLowerCase() === contractAddress.toLowerCase()) {
      // TeamCreated event should have 3 topics: [eventSignature, teamId, owner]
      // The teamId is indexed and should be in topics[1]
      if (log.topics && log.topics.length >= 2) {
        try {
          // The teamId is the first indexed parameter (topics[1])
          const teamIdHex = log.topics[1];
          if (!teamIdHex) {
            console.log("No teamId topic found in log");
            continue;
          }
          
          const extractedTeamId = BigInt(teamIdHex).toString();
          
          // Basic validation - teamId should be a positive number
          if (extractedTeamId && extractedTeamId !== "0") {
            teamId = extractedTeamId;
            console.log("✅ Extracted teamId from event logs:", teamId);
            break;
          }
        } catch (error) {
          console.log("Failed to parse teamId from log:", error);
          continue;
        }
      }
    }
  }
  
  if (!teamId || teamId === "0") {
    throw new Error("Could not extract teamId from transaction logs");
  }
  
  return teamId;
}
