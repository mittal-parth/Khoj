import { Attestations } from "./attestations";

export function calc(): i64 {
  const huntAttestation = Attestations.huntAttestationSchema;

  // Track total clues and cumulative performance
  let totalClues: i64 = 0;
  let totalScore: i64 = 0;
  let latestTimestamp: u64 = 0;

  // Access attestation values directly
  const currentTries = huntAttestation.numberOfTries;
  const currentTimestamp = huntAttestation.timestamp;

  // Track the latest timestamp
  if (currentTimestamp > latestTimestamp) {
    latestTimestamp = currentTimestamp;
  }

  // Calculate score for this attestation
  let attestationScore: i64 = 0;

  // Base points for completing clue (max 100)
  attestationScore += 100;

  // Efficiency points based on tries (max 50)
  if (currentTries == 1) {
    attestationScore += 50; // Perfect solve
  } else if (currentTries == 2) {
    attestationScore += 25; // Good solve
  } else if (currentTries == 3) {
    attestationScore += 10; // Regular solve
  }

  // Add to running totals
  totalScore += attestationScore;
  totalClues += 1;

  // If no attestations exist, return 0
  if (totalClues == 0) {
    return 0;
  }

  // Calculate average score per clue (out of 150 possible points per clue)
  // Multiply by 10 first to maintain precision in integer division
  const averageScore: i64 = (totalScore * 10) / (totalClues * 150);

  // Apply time decay factor to encourage continued participation
  // Reduce score by 10% for every 30 days of inactivity
  const daysSinceLastAttestation: i64 = i64(
    (currentTimestamp - latestTimestamp) / 86400
  );
  const decayMonths: i64 = daysSinceLastAttestation / 30;

  // Calculate decay percentage (in tenths to avoid floating point)
  // 100% = 10, 90% = 9, 80% = 8, etc.
  let decayMultiplier: i64 = 10 - decayMonths;
  if (decayMultiplier < 1) decayMultiplier = 1; // Minimum 10% of score

  // Apply decay factor (divide by 10 at the end to normalize)
  let finalScore: i64 = (averageScore * decayMultiplier) / 10;

  // Ensure score stays between 0 and 10
  if (finalScore > 10) {
    finalScore = 10;
  } else if (finalScore < 0) {
    finalScore = 0;
  }

  return finalScore;
}
