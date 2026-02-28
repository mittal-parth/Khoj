/**
 * Utility functions for the profile page
 */

import { hasRequiredTeamParams } from './validationUtils';
import type { LeaderboardEntry } from '@/types/ui';

const BACKEND_URL = import.meta.env.VITE_PUBLIC_BACKEND_URL;

export interface UserHuntSummaryResult {
  rank: number;
  score: number;
  cluesSolved: number;
  teamName?: string;
}

/**
 * Fetch leaderboard for a hunt and extract the given team's rank, score, and clues solved.
 * @param huntId - The hunt ID
 * @param teamIdentifier - The team identifier (teamId for teams, wallet address for solo users)
 * @param chainId - The chain ID
 * @param contractAddress - The contract address
 * @returns Promise resolving to rank, score, cluesSolved; rank 0 and score 0 if team not on leaderboard
 */
export async function fetchUserHuntSummary(
  huntId: string | number,
  teamIdentifier: string,
  chainId: string | number,
  contractAddress: string
): Promise<UserHuntSummaryResult> {
  const defaultResult: UserHuntSummaryResult = {
    rank: 0,
    score: 0,
    cluesSolved: 0,
  };

  if (!hasRequiredTeamParams({ huntId: String(huntId), chainId, contractAddress, teamIdentifier })) {
    return defaultResult;
  }

  try {
    const url = new URL(`${BACKEND_URL}/hunts/${huntId}/leaderboard`);
    url.searchParams.set('chainId', String(chainId));
    url.searchParams.set('contractAddress', contractAddress);
    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Failed to fetch leaderboard: ${response.status}`);
    }

    const data = await response.json();

    if (!data.leaderboard || !Array.isArray(data.leaderboard)) {
      return defaultResult;
    }

    const teamEntry = (data.leaderboard as LeaderboardEntry[]).find(
      (entry) => entry.teamIdentifier === teamIdentifier
    );

    if (!teamEntry) {
      return defaultResult;
    }

    return {
      rank: teamEntry.rank,
      score: Number(teamEntry.combinedScore.toFixed(2)),
      cluesSolved: teamEntry.cluesCompleted,
      teamName: teamEntry.teamName,
    };
  } catch (error) {
    console.error('Error fetching user hunt summary:', (error as Error)?.message);
    return defaultResult;
  }
}
