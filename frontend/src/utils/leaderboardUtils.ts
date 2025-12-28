/**
 * Utility functions for fetching team performance data from leaderboard
 */

import { isDefined, hasRequiredTeamParams } from './validationUtils';

const BACKEND_URL = import.meta.env.VITE_PUBLIC_BACKEND_URL;

/**
 * Fetch team combined score from leaderboard API
 * @param huntId - The hunt ID
 * @param teamIdentifier - The team identifier (teamId for teams, wallet address for solo users)
 * @param chainId - The chain ID
 * @param contractAddress - The contract address
 * @returns Promise resolving to the team's combined score from leaderboard (clipped to 2 decimals)
 */
export async function fetchTeamCombinedScore(huntId: string, teamIdentifier: bigint | string, chainId: string | number, contractAddress: string): Promise<number> {
  if (!hasRequiredTeamParams({ huntId, chainId, contractAddress, teamIdentifier: teamIdentifier?.toString() })) {
    return 0.0; // Default score if no team data
  }

  try {
    const url = new URL(`${BACKEND_URL}/hunts/${huntId}/leaderboard`);
    url.searchParams.set('chainId', chainId.toString());
    url.searchParams.set('contractAddress', contractAddress);
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Failed to fetch leaderboard: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.leaderboard && Array.isArray(data.leaderboard)) {
      // Find the current team in the leaderboard
      const teamEntry = data.leaderboard.find(
        (entry: any) => entry.teamIdentifier === teamIdentifier.toString()
      );
      
      if (teamEntry) {
        // Use the existing combinedScore from leaderboard, clipped to 2 decimals
        return Number(teamEntry.combinedScore.toFixed(2));
      } else {
        return 0.0;
      }
    } else {
      return 0.0;
    }
  } catch (error) {
    console.error("Error fetching team score:", error);
    return 0.0; // Fallback score
  }
}

/**
 * Formats an EVM address to a shortened version for display.
 * @param address - The blockchain address (0x...)
 * @returns Shortened format (e.g., "0x1234...5678")
 */
export const formatAddress = (address: string): string => {
  if (!isDefined(address) || address === '') return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};