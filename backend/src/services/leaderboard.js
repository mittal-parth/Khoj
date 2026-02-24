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

  // Group attestations by teamIdentifier
  const teamData = new Map();
  
  for (const attestation of attestations) {
    const data = JSON.parse(attestation.data);
    const teamIdentifier = data.teamIdentifier;
    
    if (!teamData.has(teamIdentifier)) {
      teamData.set(teamIdentifier, {
        teamIdentifier,
        teamName: data.teamName || teamIdentifier,
        teamLeaderAddress: data.teamLeaderAddress,
        clues: [],
        totalAttempts: 0,
        totalTimeTaken: 0,
        solvers: new Set(),
      });
    }
    
    const team = teamData.get(teamIdentifier);
    team.clues.push({
      clueIndex: parseInt(data.clueIndex),
      timeTaken: parseInt(data.timeTaken),
      attemptCount: parseInt(data.attemptCount),
      solverAddress: data.solverAddress,
    });
    team.totalAttempts += parseInt(data.attemptCount);
    team.totalTimeTaken += parseInt(data.timeTaken);
    team.solvers.add(data.solverAddress);
  }

  // Calculate metrics and create leaderboard
  const leaderboard = [];
  
  for (const [teamIdentifier, team] of teamData) {
    const cluesCompleted = team.clues.length;
    
    // Convert solvers set to array for response
    const solvers = Array.from(team.solvers);
    
    // Calculate combined score: timeTaken + (retries*5)
    // timeTaken is already the sum of all clue times in seconds
    // retries = totalAttempts - cluesCompleted (each clue has at least 1 attempt)
    const retries = team.totalAttempts - cluesCompleted;
    const combinedScore = team.totalTimeTaken + (retries * 5);
    
    leaderboard.push({
      teamIdentifier,
      teamName: team.teamName || teamIdentifier,
      teamLeaderAddress: team.teamLeaderAddress,
      totalTime: team.totalTimeTaken, // Now represents sum of timeTaken for all clues
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
