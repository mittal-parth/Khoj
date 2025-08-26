import { keccak256 } from "thirdweb";
import bs58 from "bs58";
import { encodeAbiParameters } from "viem";

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
  // Encode the data using viem's encodeAbiParameters
  const encodedData = encodeAbiParameters(
    [
      { type: 'string' },
      { type: 'string' },
      { type: 'uint256' },
      { type: 'uint256' },
      { type: 'address' }
    ],
    [
      'TeamInvite',
      teamId,
      BigInt(expiry),
      BigInt(chainId),
      contractAddress as `0x${string}`
    ]
  );
  
  // Hash the encoded data
  return keccak256(encodedData);
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
  // Create a JSON object with the invite data
  const inviteData = JSON.stringify({
    teamId,
    expiry,
    signature,
  });
  
  // Convert to bytes and then to Base58
  const bytes = new TextEncoder().encode(inviteData);
  return bs58.encode(bytes);
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
 * Calculate expiry time (hunt start + 1 hour)
 * @param huntStartTime - Hunt start timestamp in seconds
 * @returns Expiry timestamp in seconds
 */
export const calculateInviteExpiry = (huntStartTime: number): number => {
  // Add 1 hour (3600 seconds) to hunt start time
  return huntStartTime + 3600;
};
