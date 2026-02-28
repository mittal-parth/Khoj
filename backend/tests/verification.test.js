import dotenv from "dotenv";
dotenv.config();

import { encryptData, decryptClues, verifyLocation, verifyImage } from "../src/services/verification.js";

function ensureTestKey() {
  if (!process.env.ENCRYPTION_KEY) {
    process.env.ENCRYPTION_KEY =
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  }
}

describe("Verification service", () => {
  beforeAll(() => {
    ensureTestKey();
  });

  test("decryptClues returns parsed clue array", () => {
    const clues = [
      { id: 1, description: "First clue" },
      { id: 2, description: "Second clue" },
    ];

    const { ciphertext } = encryptData(clues);
    const decrypted = decryptClues(ciphertext);

    expect(Array.isArray(decrypted)).toBe(true);
    expect(decrypted).toEqual(clues);
  });

  test("verifyLocation returns true when user is within MAX_DISTANCE_IN_METERS", () => {
    const answers = [
      { id: 1, answer: "Target", lat: 40.7128, long: -74.006 }, // New York
    ];

    const { ciphertext } = encryptData(answers);

    // Very close to the stored coordinates
    const userLat = 40.7129;
    const userLong = -74.0061;

    const result = verifyLocation(ciphertext, 1, userLat, userLong);

    expect(result).toBe(true);
  });

  test("verifyLocation returns false when user is far away", () => {
    const answers = [
      { id: 1, answer: "Target", lat: 40.7128, long: -74.006 }, // New York
    ];

    const { ciphertext } = encryptData(answers);

    // Far away (San Francisco)
    const userLat = 37.7749;
    const userLong = -122.4194;

    const result = verifyLocation(ciphertext, 1, userLat, userLong);

    expect(result).toBe(false);
  });

  test("verifyLocation returns false when clueId is not found", () => {
    const answers = [
      { id: 1, answer: "Target", lat: 40.7128, long: -74.006 },
    ];

    const { ciphertext } = encryptData(answers);

    const userLat = 40.7128;
    const userLong = -74.006;

    const result = verifyLocation(ciphertext, 999, userLat, userLong);

    expect(result).toBe(false);
  });

  test("verifyImage returns true when embeddings are identical and above threshold", () => {
    const embedding = Array.from({ length: 8 }, () => 0.5);
    const answers = [
      { id: 1, answer: "Image target", embedding },
    ];

    const { ciphertext } = encryptData(answers);

    const result = verifyImage(ciphertext, 1, embedding, 0.9);

    expect(result).toBe(true);
  });

  test("verifyImage returns false when embeddings are dissimilar", () => {
    const targetEmbedding = Array.from({ length: 8 }, () => 0.5);
    const userEmbedding = Array.from({ length: 8 }, () => -0.5);

    const answers = [
      { id: 1, answer: "Image target", embedding: targetEmbedding },
    ];

    const { ciphertext } = encryptData(answers);

    const result = verifyImage(ciphertext, 1, userEmbedding, 0.9);

    expect(result).toBe(false);
  });

  test("verifyImage returns false when clueId is not found", () => {
    const embedding = Array.from({ length: 8 }, () => 0.5);
    const answers = [
      { id: 1, answer: "Image target", embedding },
    ];

    const { ciphertext } = encryptData(answers);

    const result = verifyImage(ciphertext, 999, embedding, 0.9);

    expect(result).toBe(false);
  });

  test("cosine similarity edge case: zero vectors handled via verifyImage", () => {
    const zeroEmbedding = Array.from({ length: 8 }, () => 0);
    const answers = [
      { id: 1, answer: "Image target", embedding: zeroEmbedding },
    ];

    const { ciphertext } = encryptData(answers);

    const result = verifyImage(ciphertext, 1, zeroEmbedding, 0.1);

    // Should not throw, but similarity will be 0 so below threshold
    expect(result).toBe(false);
  });
});
