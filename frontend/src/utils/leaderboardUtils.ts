/**
 * Utility functions for fetching team performance data from leaderboard
 */

const BACKEND_URL = import.meta.env.VITE_PUBLIC_BACKEND_URL;

/**
 * Fetch team combined score from leaderboard API
 * @param huntId - The hunt ID
 * @param teamIdentifier - The team identifier (teamId for teams, wallet address for solo users)
 * @returns Promise resolving to the team's combined score from leaderboard (clipped to 2 decimals)
 */
export async function fetchTeamCombinedScore(huntId: string, teamIdentifier: bigint | string): Promise<number> {
  if (!huntId || !teamIdentifier) {
    return 0.0; // Default score if no team data
  }

  try {
    const response = await fetch(`${BACKEND_URL}/leaderboard/${huntId}`);
    
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
