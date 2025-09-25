import { keccak256 } from "thirdweb";
import bs58 from "bs58";
import { encodePacked } from "viem";

/**
 * Generate a hash for team invitation
 * @param teamId - Team identifier
 * @param expiry - Expiration timestamp
 * @param chainId - number
 * @param contractAddress - Contract address
 * @returns The keccak256 hash
 */
export const generateInviteHash = (
  teamId: string,
  expiry: number,
  chainId: number,
  contractAddress: string
): string => {
  console.log("🔐 generateInviteHash called:");
  // Convert to BigInt for consistency
  const teamIdBigInt = BigInt(teamId);
  const expiryBigInt = BigInt(expiry);
  const chainIdBigInt = BigInt(chainId);

  // Encode the data using viem's encodePacked to match smart contract's abi.encodePacked
  const encodedData = encodePacked(
    ['string', 'uint256', 'uint256', 'uint256', 'address'],
    [
      'TeamInvite',
      teamIdBigInt,
      expiryBigInt,
      chainIdBigInt,
      contractAddress as `0x${string}`
    ]
  );

  // Hash the encoded data
  const hash = keccak256(encodedData);
  console.log("🔑 Generated hash:", hash);
  
  return hash;
};

/**
 * Encode invite data to Base58
 * @param teamId - Team identifier
 * @param expiry - Expiration timestamp
 * @param signature - Signature from wallet
 * @returns Base58 encoded string
 */
export const encodeInviteToBase58 = (
  teamId: string,
  expiry: number,
  signature: string
): string => {
  console.log("📦 encodeInviteToBase58 called with:");
  console.log("- teamId:", teamId);
  console.log("- expiry:", expiry);
  console.log("- signature:", signature);
  
  // Create a JSON object with the invite data
  const inviteData = JSON.stringify({
    teamId,
    expiry,
    signature,
  });
  
  console.log("Invite data JSON:", inviteData);
  
  // Convert to bytes and then to Base58
  const bytes = new TextEncoder().encode(inviteData);
  console.log("Encoded bytes length:", bytes.length);
  
  const base58Encoded = bs58.encode(bytes);
  console.log("Base58 encoded result:", base58Encoded);
  
  return base58Encoded;
};

/**
 * Decode Base58 invite code
 * @param encodedInvite - Base58 encoded invite string
 * @returns Decoded invite data object
 */
export const decodeBase58Invite = (encodedInvite: string): {
  teamId: string;
  expiry: number;
  signature: string;
} => {
  // Decode from Base58 to bytes and then to string
  const bytes = bs58.decode(encodedInvite);
  const jsonString = new TextDecoder().decode(bytes);
  
  // Parse the JSON string
  return JSON.parse(jsonString);
};

/**
 * Calculate expiry time (current time + 1 hour)
 * @param huntStartTime - Hunt start timestamp in seconds (unused, kept for compatibility)
 * @param _huntDuration - Hunt duration in seconds (unused, kept for compatibility)
 * @returns Expiry timestamp in seconds
 */
export const calculateInviteExpiry = (): number => {
  // Add 1 hour (3600 seconds) to current time (when invite is created)
  return Math.floor(Date.now() / 1000) + 3600;
};

/**
 * Sign a message with EIP-191 prefix for contract verification
 * This function properly handles the EIP-191 message signing that the contract expects
 */
export const signMessageWithEIP191 = async (
  hash: string,
  account: any
): Promise<string> => {
  console.log("🔐 signMessageWithEIP191 called with hash:", hash);
  
  // The contract expects the signature of the EIP-191 prefixed hash
  // The wallet's signMessage will automatically add the EIP-191 prefix
  // So we just need to give it the raw hash
  console.log("📝 Raw hash to sign (32 bytes):", hash);
  
  // Sign the raw 32-byte hash (as hex); wallet will add the EIP-191 prefix automatically
  const signature = await account.signMessage({
    message: { raw: hash as `0x${string}` },
  });
  
  console.log("✅ Signature generated:", signature);
  return signature;
};