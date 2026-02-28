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

/**
 * Build attestation timeline for a team (solve + retry entries per clue).
 * Pure function: accepts pre-fetched, already-parsed attestation data, returns structured timeline.
 * @param {Object} params
 * @param {Array} params.teamSolveAttestations - Solve attestations for the team only (each item has .parsedData, .attestTimestamp, .attestationId)
 * @param {number[]} params.solvedClueIndices - Sorted array of clue indices the team has solved
 * @param {Map<number, Array>} params.retryAttestationsByClue - Map of clueIndex -> retry attestations (raw)
 * @param {Array} params.huntStartAttestations - Attestations for clueIndex 0 (hunt start)
 * @param {string} params.teamIdentifier - Team identifier (for response)
 * @param {number} params.huntId - Hunt ID
 * @returns {{ huntId: number, teamIdentifier: string, clues: Array<{ clueIndex: number, attempts: Array }> }}
 */
export function buildAttestationTimeline({
  teamSolveAttestations,
  solvedClueIndices,
  retryAttestationsByClue,
  huntStartAttestations,
  teamIdentifier,
  huntId,
}) {
  const list = teamSolveAttestations || [];
  if (list.length === 0) {
    return { huntId, teamIdentifier, clues: [] };
  }

  const indices = solvedClueIndices ?? [...new Set(
    list.map((a) => parseInt(a.parsedData.clueIndex))
  )].sort((a, b) => a - b);

  let huntStartTimestamp = null;
  if (huntStartAttestations && huntStartAttestations.length > 0) {
    const sortedByTime = huntStartAttestations
      .map((a) => Math.floor(Number(a.attestTimestamp) / 1000))
      .sort((a, b) => a - b);
    huntStartTimestamp = sortedByTime[0];
  }

  const clues = [];

  for (const clueIndex of indices) {
    let clueStartTimestamp = null;
    if (clueIndex === 1) {
      clueStartTimestamp = huntStartTimestamp;
    } else {
      const prevClueIndex = clueIndex - 1;
      const prevSolveAttestation = list.find(
        (a) => parseInt(a.parsedData.clueIndex) === prevClueIndex
      );
      if (prevSolveAttestation) {
        clueStartTimestamp = Math.floor(Number(prevSolveAttestation.attestTimestamp) / 1000);
      }
    }

    const retryAttestations = retryAttestationsByClue?.get(clueIndex) ?? [];
    const entries = [];

    if (retryAttestations.length > 0) {
      const sortedRetries = retryAttestations
        .map((a) => {
          const data = JSON.parse(a.data);
          const rawTs = a.attestTimestamp;
          const retryTimestamp = Math.floor(Number(rawTs) / 1000);
          const timeTaken = clueStartTimestamp != null
            ? Math.max(0, retryTimestamp - clueStartTimestamp)
            : 0;
          return {
            type: "retry",
            attemptCount: parseInt(data.attemptCount),
            attestationId: a.attestationId,
            timestamp: retryTimestamp,
            timeTaken,
            clueIndex,
          };
        })
        .sort((a, b) => a.timestamp - b.timestamp);
      entries.push(...sortedRetries);
    }

    const solveAttestation = list.find(
      (a) => parseInt(a.parsedData.clueIndex) === clueIndex
    );
    if (solveAttestation) {
      const data = solveAttestation.parsedData;
      entries.push({
        type: "solve",
        attemptCount: parseInt(data.attemptCount),
        attestationId: solveAttestation.attestationId,
        timestamp: Math.floor(Number(solveAttestation.attestTimestamp) / 1000),
        timeTaken: parseInt(data.timeTaken),
        clueIndex,
      });
    }

    entries.sort((a, b) => a.timestamp - b.timestamp);
    clues.push({ clueIndex, attempts: entries });
  }

  return { huntId, teamIdentifier, clues };
}
