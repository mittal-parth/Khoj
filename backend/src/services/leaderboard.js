/**
 * Leaderboard calculation logic
 * 
 * Ranking criteria:
 * 1. Most clues solved (primary)
 * 2. Combined score of time and retries (secondary)
 *    - Score = (totalTime / 60) + (totalAttempts * 5)
 *    - Lower score is better
 *    - Optimized for 5-15 minute clue solving times
 * 3. No further tie-breaking needed
 */

/**
 * Calculate leaderboard from attestations
 * @param {Array} attestations - Array of attestation objects with data field
 * @returns {Array} Ranked leaderboard array
 */
export function calculateLeaderboard(attestations) {
  if (!attestations || attestations.length === 0) {
    return [];
  }

  // Group attestations by teamId
  const teamData = new Map();
  
  for (const attestation of attestations) {
    const data = JSON.parse(attestation.data);
    const teamId = parseInt(data.teamId);
    
    if (!teamData.has(teamId)) {
      teamData.set(teamId, {
        teamId,
        teamLeaderAddress: data.teamLeaderAddress,
        clues: [],
        totalAttempts: 0,
        solvers: new Set(),
      });
    }
    
    const team = teamData.get(teamId);
    team.clues.push({
      clueIndex: parseInt(data.clueIndex),
      timestamp: parseInt(data.timestamp),
      attemptCount: parseInt(data.attemptCount),
      solverAddress: data.solverAddress,
    });
    team.totalAttempts += parseInt(data.attemptCount);
    team.solvers.add(data.solverAddress);
  }

  // Calculate metrics and create leaderboard
  const leaderboard = [];
  
  for (const [teamId, team] of teamData) {
    // Sort clues by timestamp to get first and last solve times
    team.clues.sort((a, b) => a.timestamp - b.timestamp);
    
    const firstSolveTime = team.clues[0].timestamp;
    const lastSolveTime = team.clues[team.clues.length - 1].timestamp;
    const totalTime = lastSolveTime - firstSolveTime;
    const cluesCompleted = team.clues.length;
    
    // Convert solvers set to array for response
    const solvers = Array.from(team.solvers);
    
    // Calculate combined score: (time/60) + (attempts*5)
    // Optimized for 5-15 minute clue solving times
    const combinedScore = (totalTime / 60) + (team.totalAttempts * 5);
    
    leaderboard.push({
      teamId,
      teamLeaderAddress: team.teamLeaderAddress,
      totalTime,
      totalAttempts: team.totalAttempts,
      cluesCompleted,
      solvers,
      solverCount: solvers.length,
      combinedScore, // For debugging/analysis
    });
  }

  // Sort teams: Primary by clues completed (desc), Secondary by combined score (asc)
  leaderboard.sort((a, b) => {
    // Primary: Most clues solved first
    if (a.cluesCompleted !== b.cluesCompleted) {
      return b.cluesCompleted - a.cluesCompleted; // Higher clues first
    }
    
    // Secondary: Lower combined score first
    return a.combinedScore - b.combinedScore;
  });

  // Add rank numbers
  const rankedLeaderboard = leaderboard.map((team, index) => ({
    rank: index + 1,
    ...team,
  }));

  return rankedLeaderboard;
}

/**
 * Calculate leaderboard for a specific hunt
 * @param {Array} attestations - Array of attestation objects
 * @param {number} huntId - Hunt ID to filter by
 * @returns {Array} Ranked leaderboard array for the hunt
 */
export function calculateLeaderboardForHunt(attestations, huntId) {
  const huntAttestations = attestations.filter(attestation => {
    const data = JSON.parse(attestation.data);
    return parseInt(data.huntId) === huntId;
  });
  
  return calculateLeaderboard(huntAttestations);
}
