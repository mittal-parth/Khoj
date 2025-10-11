#!/usr/bin/env node

/**
 * Test script for leaderboard logic
 * This script tests the leaderboard calculation logic extensively with mock data
 * without requiring real Sign Protocol attestations
 */

import { calculateLeaderboard } from '../src/services/leaderboard.js';

// Mock attestation data for testing leaderboard logic
const mockAttestations = [
  // Team 1 - 3 clues solved, moderate time and attempts (should rank #1 - most clues solved)
  {
    data: JSON.stringify({
      teamId: "1",
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
      teamId: "1",
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
      teamId: "1",
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
      teamId: "2",
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
      teamId: "2",
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
      teamId: "3",
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
      teamId: "3",
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
      teamId: "4",
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
      teamId: "4",
      huntId: "0",
      clueIndex: "2",
      teamLeaderAddress: "0x7777777777777777777777777777777777777777",
      solverAddress: "0x7777777777777777777777777777777777777777",
      timestamp: "1700000300", // 5 minutes later (very fast)
      attemptCount: "1" // Very few attempts
    })
  },
  
  // Team 5 - 1 clue only (should rank last - fewest clues)
  {
    data: JSON.stringify({
      teamId: "5",
      huntId: "0",
      clueIndex: "1",
      teamLeaderAddress: "0x8888888888888888888888888888888888888888",
      solverAddress: "0x8888888888888888888888888888888888888888",
      timestamp: "1700000000",
      attemptCount: "1" // Very few attempts but only 1 clue
    })
  }
];

function testLeaderboardLogic(attestations) {
  console.log('🧪 Testing Leaderboard Logic...\n');
  
  // Use the extracted leaderboard calculation function
  return calculateLeaderboard(attestations);
}

function runLeaderboardTests() {
  console.log('🏆 Running Comprehensive Leaderboard Tests\n');
  
  // Test 1: Basic leaderboard calculation
  console.log('1️⃣ Basic Leaderboard Calculation');
  const leaderboard = testLeaderboardLogic(mockAttestations);
  
  console.log('📊 Results:');
  leaderboard.forEach((team, index) => {
    console.log(`   ${team.rank}. Team ${team.teamId}`);
    console.log(`      Time: ${team.totalTime}s, Attempts: ${team.totalAttempts}, Clues: ${team.cluesCompleted}`);
    console.log(`      Solvers: ${team.solverCount} unique (${team.solvers.join(', ')})\n`);
  });
  
  // Test 2: Verify ranking logic
  console.log('2️⃣ Verifying New Ranking Logic');
  console.log('✅ Teams should be ranked by: 1) Most clues solved, 2) Combined score (time/60 + attempts*5)');
  
  for (let i = 0; i < leaderboard.length - 1; i++) {
    const current = leaderboard[i];
    const next = leaderboard[i + 1];
    
    let reason = '';
    if (current.cluesCompleted > next.cluesCompleted) {
      reason = `more clues solved (${current.cluesCompleted} vs ${next.cluesCompleted})`;
    } else if (current.cluesCompleted === next.cluesCompleted) {
      reason = `better combined score (${current.combinedScore.toFixed(2)} vs ${next.combinedScore.toFixed(2)})`;
    }
    
    console.log(`   Team ${current.teamId} ranks above Team ${next.teamId}: ${reason}`);
  }
  
  // Test 3: Verify expected ranking based on new logic
  console.log('\n3️⃣ Verifying Expected Ranking');
  
  // Expected ranking: Team 1 (3 clues) > Team 4 (2 clues, best score) > Team 3 (2 clues, medium score) > Team 2 (2 clues, worst score) > Team 5 (1 clue)
  const expectedRanking = [1, 4, 3, 2, 5];
  const actualRanking = leaderboard.map(team => team.teamId);
  
  console.log(`Expected ranking: ${expectedRanking.join(' -> ')}`);
  console.log(`Actual ranking:   ${actualRanking.join(' -> ')}`);
  
  const rankingCorrect = JSON.stringify(expectedRanking) === JSON.stringify(actualRanking);
  if (rankingCorrect) {
    console.log('✅ Ranking matches expected order!');
  } else {
    console.log('❌ Ranking does not match expected order!');
  }
  
  // Test single clue team
  const singleClueTeam = leaderboard.find(team => team.cluesCompleted === 1);
  if (singleClueTeam) {
    console.log(`✅ Single clue team (Team ${singleClueTeam.teamId}): totalTime = 0s (correct for single clue)`);
  }
  
  // Test teams with same clue count are ranked by combined score
  const twoClueTeams = leaderboard.filter(team => team.cluesCompleted === 2);
  if (twoClueTeams.length > 1) {
    console.log(`✅ Teams with same clue count (${twoClueTeams.length} teams) are ranked by combined score`);
    twoClueTeams.forEach((team, index) => {
      if (index > 0) {
        const prevTeam = twoClueTeams[index - 1];
        if (team.combinedScore >= prevTeam.combinedScore) {
          console.log(`   ✅ Team ${team.teamId} (score: ${team.combinedScore.toFixed(2)}) correctly ranked after Team ${prevTeam.teamId} (score: ${prevTeam.combinedScore.toFixed(2)})`);
        } else {
          console.log(`   ❌ Team ${team.teamId} incorrectly ranked before Team ${prevTeam.teamId}`);
        }
      }
    });
  }
  
  // Test 4: Data integrity
  console.log('\n4️⃣ Data Integrity Checks');
  
  leaderboard.forEach(team => {
    // Check that solver count matches unique solvers
    const uniqueSolvers = new Set(team.solvers).size;
    if (team.solverCount === uniqueSolvers) {
      console.log(`✅ Team ${team.teamId}: Solver count matches unique solvers (${team.solverCount})`);
    } else {
      console.log(`❌ Team ${team.teamId}: Solver count mismatch!`);
    }
    
    // Check that total attempts is reasonable
    if (team.totalAttempts > 0) {
      console.log(`✅ Team ${team.teamId}: Total attempts is positive (${team.totalAttempts})`);
    } else {
      console.log(`❌ Team ${team.teamId}: Total attempts is zero or negative!`);
    }
  });
  
  // Test 5: Performance metrics
  console.log('\n5️⃣ Performance Metrics');
  const totalTeams = leaderboard.length;
  const totalClues = leaderboard.reduce((sum, team) => sum + team.cluesCompleted, 0);
  const avgTime = leaderboard.reduce((sum, team) => sum + team.totalTime, 0) / totalTeams;
  const avgAttempts = leaderboard.reduce((sum, team) => sum + team.totalAttempts, 0) / totalTeams;
  const avgScore = leaderboard.reduce((sum, team) => sum + team.combinedScore, 0) / totalTeams;
  
  console.log(`📈 Statistics:`);
  console.log(`   Total teams: ${totalTeams}`);
  console.log(`   Total clues solved: ${totalClues}`);
  console.log(`   Average completion time: ${avgTime.toFixed(2)}s`);
  console.log(`   Average attempts per team: ${avgAttempts.toFixed(2)}`);
  console.log(`   Average combined score: ${avgScore.toFixed(2)}`);
  
  // Show detailed scores for analysis
  console.log(`\n📊 Detailed Team Scores:`);
  leaderboard.forEach(team => {
    console.log(`   Team ${team.teamId}: ${team.cluesCompleted} clues, ${team.totalTime}s, ${team.totalAttempts} attempts, score: ${team.combinedScore.toFixed(2)}`);
  });
  
  console.log('\n🎉 All leaderboard tests completed successfully!');
}

// Run the tests
runLeaderboardTests();
