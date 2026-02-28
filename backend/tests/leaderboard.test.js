/**
 * Test suite for leaderboard logic
 * This test suite tests the leaderboard calculation logic extensively with mock data
 * without requiring real Sign Protocol attestations
 */

import { calculateLeaderboard, buildAttestationTimeline } from '../src/services/leaderboard.js';

// Mock attestation data for testing leaderboard logic
const mockAttestations = [
  // Team 1 - 3 clues solved, moderate time and attempts (should rank #1 - most clues solved)
  {
    data: JSON.stringify({
      teamIdentifier: "1",
      huntId: "0",
      clueIndex: "1",
      teamLeaderAddress: "0x1111111111111111111111111111111111111111",
      solverAddress: "0x1111111111111111111111111111111111111111",
      timeTaken: "600", // 10 minutes to solve
      attemptCount: "2"
    })
  },
  {
    data: JSON.stringify({
      teamIdentifier: "1",
      huntId: "0",
      clueIndex: "2",
      teamLeaderAddress: "0x1111111111111111111111111111111111111111",
      solverAddress: "0x2222222222222222222222222222222222222222",
      timeTaken: "300", // 5 minutes to solve
      attemptCount: "1"
    })
  },
  {
    data: JSON.stringify({
      teamIdentifier: "1",
      huntId: "0",
      clueIndex: "3",
      teamLeaderAddress: "0x1111111111111111111111111111111111111111",
      solverAddress: "0x1111111111111111111111111111111111111111",
      timeTaken: "900", // 15 minutes to solve
      attemptCount: "3"
    })
  },
  
  // Team 2 - 2 clues, fast time but more attempts (should rank #2 - fewer clues than Team 1)
  {
    data: JSON.stringify({
      teamIdentifier: "2",
      huntId: "0",
      clueIndex: "1",
      teamLeaderAddress: "0x3333333333333333333333333333333333333333",
      solverAddress: "0x3333333333333333333333333333333333333333",
      timeTaken: "180", // 3 minutes to solve
      attemptCount: "1"
    })
  },
  {
    data: JSON.stringify({
      teamIdentifier: "2",
      huntId: "0",
      clueIndex: "2",
      teamLeaderAddress: "0x3333333333333333333333333333333333333333",
      solverAddress: "0x4444444444444444444444444444444444444444",
      timeTaken: "240", // 4 minutes to solve
      attemptCount: "4" // More attempts than Team 1
    })
  },
  
  // Team 3 - 2 clues, slower time but fewer attempts (should rank #3 - same clues as Team 2, worse combined score)
  {
    data: JSON.stringify({
      teamIdentifier: "3",
      huntId: "0",
      clueIndex: "1",
      teamLeaderAddress: "0x5555555555555555555555555555555555555555",
      solverAddress: "0x5555555555555555555555555555555555555555",
      timeTaken: "400", // 6.67 minutes to solve
      attemptCount: "1"
    })
  },
  {
    data: JSON.stringify({
      teamIdentifier: "3",
      huntId: "0",
      clueIndex: "2",
      teamLeaderAddress: "0x5555555555555555555555555555555555555555",
      solverAddress: "0x6666666666666666666666666666666666666666",
      timeTaken: "500", // 8.33 minutes to solve
      attemptCount: "2" // Fewer attempts than Team 2
    })
  },
  
  // Team 4 - 2 clues, very fast time and very few attempts (should rank #2 - same clues as Team 2, better combined score)
  {
    data: JSON.stringify({
      teamIdentifier: "4",
      huntId: "0",
      clueIndex: "1",
      teamLeaderAddress: "0x7777777777777777777777777777777777777777",
      solverAddress: "0x7777777777777777777777777777777777777777",
      timeTaken: "120", // 2 minutes to solve
      attemptCount: "1"
    })
  },
  {
    data: JSON.stringify({
      teamIdentifier: "4",
      huntId: "0",
      clueIndex: "2",
      teamLeaderAddress: "0x7777777777777777777777777777777777777777",
      solverAddress: "0x7777777777777777777777777777777777777777",
      timeTaken: "150", // 2.5 minutes to solve
      attemptCount: "1" // Very few attempts
    })
  },
  
  // Solo user - 1 clue only (should rank last - fewest clues)
  {
    data: JSON.stringify({
      teamIdentifier: "0x8888888888888888888888888888888888888888", // Solo user (wallet address)
      huntId: "0",
      clueIndex: "1",
      teamLeaderAddress: "0x8888888888888888888888888888888888888888",
      solverAddress: "0x8888888888888888888888888888888888888888",
      timeTaken: "200", // 3.33 minutes to solve
      attemptCount: "1" // Very few attempts but only 1 clue
    })
  }
];

describe('Leaderboard Logic', () => {
  let leaderboard;

  beforeAll(() => {
    leaderboard = calculateLeaderboard(mockAttestations);
  });

  describe('Basic Functionality', () => {
    test('should return an array', () => {
      expect(Array.isArray(leaderboard)).toBe(true);
    });

    test('should not be empty', () => {
      expect(leaderboard.length).toBeGreaterThan(0);
    });

    test('should have correct number of teams', () => {
      expect(leaderboard.length).toBe(5);
    });
  });

  describe('Ranking Logic', () => {
    test('should rank teams by clue count first', () => {
      // Team 1 should rank first (3 clues)
      expect(leaderboard[0].teamIdentifier).toBe("1");
      expect(leaderboard[0].cluesCompleted).toBe(3);
    });

    test('should rank teams with same clue count by combined score', () => {
      const twoClueTeams = leaderboard.filter(team => team.cluesCompleted === 2);
      expect(twoClueTeams.length).toBe(3);
      
      // Team 4 should rank first among 2-clue teams (best combined score)
      expect(twoClueTeams[0].teamIdentifier).toBe("4");
      expect(twoClueTeams[0].combinedScore).toBeLessThan(twoClueTeams[1].combinedScore);
      expect(twoClueTeams[1].combinedScore).toBeLessThan(twoClueTeams[2].combinedScore);
    });

    test('should have correct expected ranking order', () => {
      // Team 1: 3 clues, score = 1800 + 15 = 1815 (rank 1 - most clues)
      // Team 4: 2 clues, score = 270 + 0 = 270 (rank 2 - best score among 2-clue teams)
      // Team 2: 2 clues, score = 420 + 15 = 435 (rank 3 - 2nd best score among 2-clue teams)
      // Team 3: 2 clues, score = 900 + 5 = 905 (rank 4 - 3rd best score among 2-clue teams)
      // Solo: 1 clue, score = 200 + 0 = 200 (rank 5 - fewest clues)
      const expectedRanking = ["1", "4", "2", "3", "0x8888888888888888888888888888888888888888"];
      const actualRanking = leaderboard.map(team => team.teamIdentifier);
      expect(actualRanking).toEqual(expectedRanking);
    });
  });

  describe('Team Data Validation', () => {
    test('should have correct team 1 data', () => {
      const team1 = leaderboard.find(team => team.teamIdentifier === "1");
      expect(team1).toBeDefined();
      expect(team1.cluesCompleted).toBe(3);
      expect(team1.totalTime).toBe(1800); // Sum of timeTaken: 600 + 300 + 900 = 1800 seconds
      expect(team1.totalAttempts).toBe(6);
      expect(team1.solverCount).toBe(2);
      expect(team1.rank).toBe(1);
    });

    test('should have correct team 4 data', () => {
      const team4 = leaderboard.find(team => team.teamIdentifier === "4");
      expect(team4).toBeDefined();
      expect(team4.cluesCompleted).toBe(2);
      expect(team4.totalTime).toBe(270); // Sum of timeTaken: 120 + 150 = 270 seconds
      expect(team4.totalAttempts).toBe(2);
      expect(team4.solverCount).toBe(1);
      expect(team4.rank).toBe(2);
    });

    test('should have correct solo user data', () => {
      const soloUser = leaderboard.find(team => team.teamIdentifier.startsWith('0x'));
      expect(soloUser).toBeDefined();
      expect(soloUser.cluesCompleted).toBe(1);
      expect(soloUser.totalTime).toBe(200); // timeTaken for single clue is 200 seconds
      expect(soloUser.totalAttempts).toBe(1);
      expect(soloUser.solverCount).toBe(1);
      expect(soloUser.rank).toBe(5);
    });
  });

  describe('Data Integrity', () => {
    test('solver count should match unique solvers', () => {
      leaderboard.forEach(team => {
        const uniqueSolvers = new Set(team.solvers).size;
        expect(team.solverCount).toBe(uniqueSolvers);
      });
    });

    test('total attempts should be positive', () => {
      leaderboard.forEach(team => {
        expect(team.totalAttempts).toBeGreaterThan(0);
      });
    });

    test('all teams should have required properties', () => {
      leaderboard.forEach(team => {
        expect(team).toHaveProperty('teamIdentifier');
        expect(team).toHaveProperty('cluesCompleted');
        expect(team).toHaveProperty('totalTime');
        expect(team).toHaveProperty('totalAttempts');
        expect(team).toHaveProperty('combinedScore');
        expect(team).toHaveProperty('solverCount');
        expect(team).toHaveProperty('solvers');
        expect(team).toHaveProperty('rank');
      });
    });
  });

  describe('Combined Score Calculation', () => {
    test('should calculate combined score correctly', () => {
      const team1 = leaderboard.find(team => team.teamIdentifier === "1");
      // Combined score = timeTaken + (retries * 5)
      // retries = totalAttempts - cluesCompleted
      // Team 1: 1800 + ((6 - 3) * 5) = 1800 + 15 = 1815
      expect(team1.combinedScore).toBe(1815);
    });

    test('should calculate team 4 score correctly', () => {
      const team4 = leaderboard.find(team => team.teamIdentifier === "4");
      // Team 4: 270 + ((2 - 2) * 5) = 270 + 0 = 270
      expect(team4.combinedScore).toBe(270);
    });

    test('should calculate solo user score correctly', () => {
      const soloUser = leaderboard.find(team => team.teamIdentifier.startsWith('0x'));
      // Solo user: 200 + ((1 - 1) * 5) = 200 + 0 = 200
      expect(soloUser.combinedScore).toBe(200);
    });
  });

  describe('Edge Cases', () => {
    test('single clue teams should have their timeTaken value', () => {
      const singleClueTeams = leaderboard.filter(team => team.cluesCompleted === 1);
      singleClueTeams.forEach(team => {
        expect(team.totalTime).toBeGreaterThan(0); // timeTaken is now per clue, not cumulative
      });
    });

    test('all teams should have unique ranks', () => {
      const ranks = leaderboard.map(team => team.rank);
      const uniqueRanks = new Set(ranks);
      expect(uniqueRanks.size).toBe(ranks.length);
    });

    test('ranks should be sequential starting from 1', () => {
      const ranks = leaderboard.map(team => team.rank).sort((a, b) => a - b);
      expect(ranks[0]).toBe(1);
      for (let i = 1; i < ranks.length; i++) {
        expect(ranks[i]).toBe(ranks[i - 1] + 1);
      }
    });
  });

  describe('Performance Metrics', () => {
    test('should have correct total statistics', () => {
      const totalTeams = leaderboard.length;
      const totalClues = leaderboard.reduce((sum, team) => sum + team.cluesCompleted, 0);
      const avgTime = leaderboard.reduce((sum, team) => sum + team.totalTime, 0) / totalTeams;
      const avgAttempts = leaderboard.reduce((sum, team) => sum + team.totalAttempts, 0) / totalTeams;

      expect(totalTeams).toBe(5);
      expect(totalClues).toBe(10);
      // Total time: 1800 + 420 + 900 + 270 + 200 = 3590
      // Average: 3590 / 5 = 718
      expect(avgTime).toBe(718);
      // Total attempts: 6 + 5 + 3 + 2 + 1 = 17
      // Average: 17 / 5 = 3.4
      expect(avgAttempts).toBe(3.4);
    });
  });
});

describe('Attestation Timeline', () => {
  const huntId = 1;
  const teamId = 'team-alpha';

  // Hunt start at 1000s (attestTimestamp in ms)
  const huntStartTsMs = 1_000_000;
  const huntStartAttestations = [
    { data: JSON.stringify({ attemptCount: '0' }), attestTimestamp: huntStartTsMs, attestationId: 'start-1' },
  ];

  // Solve attestations: team-alpha solves clue 1 at 1600s (timeTaken 600), clue 2 at 1900s (timeTaken 300)
  const solveAttestations = [
    {
      data: JSON.stringify({
        teamIdentifier: teamId,
        clueIndex: '1',
        timeTaken: '600',
        attemptCount: '2',
      }),
      attestTimestamp: 1_600_000, // 1600s
      attestationId: 'solve-clue1',
    },
    {
      data: JSON.stringify({
        teamIdentifier: teamId,
        clueIndex: '2',
        timeTaken: '300',
        attemptCount: '1',
      }),
      attestTimestamp: 1_900_000, // 1900s
      attestationId: 'solve-clue2',
    },
  ];

  // Retry for clue 1 at 1300s (300s after hunt start)
  const retryClue1 = [
    {
      data: JSON.stringify({ attemptCount: '1' }),
      attestTimestamp: 1_300_000, // 1300s
      attestationId: 'retry-clue1',
    },
  ];

  const retryAttestationsByClue = new Map([
    [1, retryClue1],
    [2, []], // clue 2 solved on first attempt
  ]);

  // Parsed team solve attestations (as server would pass after parse + filter)
  const teamSolveAttestations = solveAttestations.map((a) => ({
    ...a,
    parsedData: JSON.parse(a.data),
  }));

  const solvedClueIndices = [1, 2];

  describe('Happy path', () => {
    test('returns correct structure with huntId, teamIdentifier, clues', () => {
      const result = buildAttestationTimeline({
        teamSolveAttestations,
        solvedClueIndices,
        retryAttestationsByClue,
        huntStartAttestations,
        teamIdentifier: teamId,
        huntId,
      });
      expect(result).toHaveProperty('huntId', huntId);
      expect(result).toHaveProperty('teamIdentifier', teamId);
      expect(result).toHaveProperty('clues');
      expect(Array.isArray(result.clues)).toBe(true);
      expect(result.clues.length).toBe(2);
    });

    test('clue 1 has retry then solve, with correct timeTaken', () => {
      const result = buildAttestationTimeline({
        teamSolveAttestations,
        solvedClueIndices,
        retryAttestationsByClue,
        huntStartAttestations,
        teamIdentifier: teamId,
        huntId,
      });
      const clue1 = result.clues.find((c) => c.clueIndex === 1);
      expect(clue1).toBeDefined();
      expect(clue1.attempts.length).toBe(2); // retry + solve
      const [retryEntry, solveEntry] = clue1.attempts;
      expect(retryEntry.type).toBe('retry');
      expect(retryEntry.timestamp).toBe(1300); // 1300000/1000
      expect(retryEntry.timeTaken).toBe(300); // 1300 - 1000 (hunt start)
      expect(solveEntry.type).toBe('solve');
      expect(solveEntry.timestamp).toBe(1600);
      expect(solveEntry.timeTaken).toBe(600); // from data
    });

    test('clue 2 has only solve entry (no retries)', () => {
      const result = buildAttestationTimeline({
        teamSolveAttestations,
        solvedClueIndices,
        retryAttestationsByClue,
        huntStartAttestations,
        teamIdentifier: teamId,
        huntId,
      });
      const clue2 = result.clues.find((c) => c.clueIndex === 2);
      expect(clue2).toBeDefined();
      expect(clue2.attempts.length).toBe(1);
      expect(clue2.attempts[0].type).toBe('solve');
      expect(clue2.attempts[0].timeTaken).toBe(300);
    });

    test('attempts are sorted by timestamp', () => {
      const result = buildAttestationTimeline({
        teamSolveAttestations,
        solvedClueIndices,
        retryAttestationsByClue,
        huntStartAttestations,
        teamIdentifier: teamId,
        huntId,
      });
      result.clues.forEach((clue) => {
        for (let i = 1; i < clue.attempts.length; i++) {
          expect(clue.attempts[i].timestamp).toBeGreaterThanOrEqual(clue.attempts[i - 1].timestamp);
        }
      });
    });
  });

  describe('Empty team', () => {
    test('returns clues empty when teamSolveAttestations is empty', () => {
      const result = buildAttestationTimeline({
        teamSolveAttestations: [],
        solvedClueIndices: [],
        retryAttestationsByClue: new Map(),
        huntStartAttestations: [],
        teamIdentifier: 'other-team',
        huntId,
      });
      expect(result.huntId).toBe(huntId);
      expect(result.teamIdentifier).toBe('other-team');
      expect(result.clues).toEqual([]);
    });
  });

  describe('Clue 1 timing', () => {
    test('uses hunt start timestamp as time reference for clue 1', () => {
      const result = buildAttestationTimeline({
        teamSolveAttestations,
        solvedClueIndices,
        retryAttestationsByClue,
        huntStartAttestations,
        teamIdentifier: teamId,
        huntId,
      });
      const clue1 = result.clues.find((c) => c.clueIndex === 1);
      const retry = clue1.attempts.find((a) => a.type === 'retry');
      expect(retry.timeTaken).toBe(300); // 1300 - 1000 (hunt start)
    });
  });

  describe('Clue 2+ timing', () => {
    test('uses previous clue solve timestamp as reference for clue 2', () => {
      const result = buildAttestationTimeline({
        teamSolveAttestations,
        solvedClueIndices,
        retryAttestationsByClue,
        huntStartAttestations,
        teamIdentifier: teamId,
        huntId,
      });
      const clue2 = result.clues.find((c) => c.clueIndex === 2);
      expect(clue2.attempts[0].type).toBe('solve');
      expect(clue2.attempts[0].timestamp).toBe(1900); // from clue 2 solve
      expect(clue2.attempts[0].timeTaken).toBe(300); // from data (time since clue 1 solve)
    });
  });

  describe('Solve entry present', () => {
    test('each clue has solve entry last in attempts', () => {
      const result = buildAttestationTimeline({
        teamSolveAttestations,
        solvedClueIndices,
        retryAttestationsByClue,
        huntStartAttestations,
        teamIdentifier: teamId,
        huntId,
      });
      result.clues.forEach((clue) => {
        const last = clue.attempts[clue.attempts.length - 1];
        expect(last.type).toBe('solve');
        expect(last).toHaveProperty('attemptCount');
        expect(last).toHaveProperty('attestationId');
        expect(last).toHaveProperty('timestamp');
        expect(last).toHaveProperty('timeTaken');
      });
    });
  });

  describe('No retries for a clue', () => {
    test('clue with no retries has only solve entry', () => {
      const retriesEmpty = new Map([[1, []], [2, []]]);
      const result = buildAttestationTimeline({
        teamSolveAttestations,
        solvedClueIndices,
        retryAttestationsByClue: retriesEmpty,
        huntStartAttestations,
        teamIdentifier: teamId,
        huntId,
      });
      result.clues.forEach((clue) => {
        expect(clue.attempts.length).toBe(1);
        expect(clue.attempts[0].type).toBe('solve');
      });
    });
  });
});
