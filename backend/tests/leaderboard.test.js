/**
 * Test suite for leaderboard logic
 * This test suite tests the leaderboard calculation logic extensively with mock data
 * without requiring real Sign Protocol attestations
 */

import { calculateLeaderboard } from '../src/services/leaderboard.js';

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
      timestamp: "1700000000", // Start time
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
      timestamp: "1700000600", // 10 minutes later (600 seconds)
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
      timestamp: "1700001200", // 20 minutes later (1200 seconds)
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
      timestamp: "1700000000", // Same start time as Team 1
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
      timestamp: "1700000300", // 5 minutes later (faster than Team 1)
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
      timestamp: "1700000600", // 10 minutes after start
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
      timestamp: "1700001200", // 20 minutes after start (slower than Team 2)
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
      timestamp: "1700000000", // Same start time
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
      timestamp: "1700000300", // 5 minutes later (very fast)
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
      timestamp: "1700000000",
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
      const expectedRanking = ["1", "4", "3", "2", "0x8888888888888888888888888888888888888888"];
      const actualRanking = leaderboard.map(team => team.teamIdentifier);
      expect(actualRanking).toEqual(expectedRanking);
    });
  });

  describe('Team Data Validation', () => {
    test('should have correct team 1 data', () => {
      const team1 = leaderboard.find(team => team.teamIdentifier === "1");
      expect(team1).toBeDefined();
      expect(team1.cluesCompleted).toBe(3);
      expect(team1.totalTime).toBe(1200); // 20 minutes
      expect(team1.totalAttempts).toBe(6);
      expect(team1.solverCount).toBe(2);
      expect(team1.rank).toBe(1);
    });

    test('should have correct team 4 data', () => {
      const team4 = leaderboard.find(team => team.teamIdentifier === "4");
      expect(team4).toBeDefined();
      expect(team4.cluesCompleted).toBe(2);
      expect(team4.totalTime).toBe(300); // 5 minutes
      expect(team4.totalAttempts).toBe(2);
      expect(team4.solverCount).toBe(1);
      expect(team4.rank).toBe(2);
    });

    test('should have correct solo user data', () => {
      const soloUser = leaderboard.find(team => team.teamIdentifier.startsWith('0x'));
      expect(soloUser).toBeDefined();
      expect(soloUser.cluesCompleted).toBe(1);
      expect(soloUser.totalTime).toBe(0); // Single clue = 0 time
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
      // Combined score = (totalTime / 60) + (totalAttempts * 5)
      // Team 1: (1200 / 60) + (6 * 5) = 20 + 30 = 50
      expect(team1.combinedScore).toBe(50);
    });

    test('should calculate team 4 score correctly', () => {
      const team4 = leaderboard.find(team => team.teamIdentifier === "4");
      // Team 4: (300 / 60) + (2 * 5) = 5 + 10 = 15
      expect(team4.combinedScore).toBe(15);
    });

    test('should calculate solo user score correctly', () => {
      const soloUser = leaderboard.find(team => team.teamIdentifier.startsWith('0x'));
      // Solo user: (0 / 60) + (1 * 5) = 0 + 5 = 5
      expect(soloUser.combinedScore).toBe(5);
    });
  });

  describe('Edge Cases', () => {
    test('single clue teams should have zero total time', () => {
      const singleClueTeams = leaderboard.filter(team => team.cluesCompleted === 1);
      singleClueTeams.forEach(team => {
        expect(team.totalTime).toBe(0);
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
      expect(avgTime).toBe(480); // (1200 + 300 + 600 + 300 + 0) / 5
      expect(avgAttempts).toBe(3.4); // (6 + 2 + 3 + 5 + 1) / 5
    });
  });
});
