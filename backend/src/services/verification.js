import dotenv from "dotenv";
dotenv.config();

import haversineDistance from "../utils/haversine-distance.js";
import { encrypt, decrypt } from "./encryption.js";
import { SIMILARITY_THRESHOLD as DEFAULT_SIMILARITY_THRESHOLD } from "./vertex-ai.js";

const DEFAULT_MAX_DISTANCE_IN_METERS =
  parseFloat(process.env.MAX_DISTANCE_IN_METERS) || 60;

function getMaxDistanceMeters() {
  return DEFAULT_MAX_DISTANCE_IN_METERS;
}

/**
 * Helper to ensure we always encrypt a string representation.
 * Accepts either a string or a JSON-serializable value.
 *
 * @param {string|any} message
 * @returns {{ ciphertext: string }}
 */
export function encryptData(message) {
  const toEncrypt =
    typeof message === "string" ? message : JSON.stringify(message);
  const ciphertext = encrypt(toEncrypt);
  return { ciphertext };
}

/**
 * Decrypts clues ciphertext and returns a parsed array.
 *
 * @param {string} ciphertext
 * @returns {any[]} clues array
 */
export function decryptClues(ciphertext) {
  const decrypted = decrypt(ciphertext);
  const parsed = JSON.parse(decrypted);

  if (!Array.isArray(parsed)) {
    throw new Error("Decrypted clues data is not an array");
  }

  return parsed;
}

function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    const va = a[i];
    const vb = b[i];

    dotProduct += va * vb;
    normA += va * va;
    normB += vb * vb;
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Verifies a user's location against encrypted answers.
 *
 * @param {string} ciphertext - Encrypted JSON array of answers
 * @param {string|number} clueId
 * @param {number} userLat
 * @param {number} userLong
 * @param {number} [maxDistanceMeters]
 * @returns {boolean}
 */
export function verifyLocation(
  ciphertext,
  clueId,
  userLat,
  userLong,
  maxDistanceMeters = getMaxDistanceMeters()
) {
  if (
    typeof userLat !== "number" ||
    typeof userLong !== "number" ||
    Number.isNaN(userLat) ||
    Number.isNaN(userLong)
  ) {
    throw new Error("userLat and userLong must be valid numbers");
  }

  const decrypted = decrypt(ciphertext);
  const answers = JSON.parse(decrypted);

  if (!Array.isArray(answers)) {
    throw new Error("Decrypted answers data is not an array");
  }

  const target = answers.find((answer) => answer.id === clueId);

  if (
    !target ||
    typeof target.lat !== "number" ||
    typeof target.long !== "number"
  ) {
    return false;
  }

  const distance = haversineDistance(
    { lat: target.lat, lng: target.long },
    { lat: userLat, lng: userLong }
  );

  console.log("Distance:", distance, "Max distance:", maxDistanceMeters);
  return distance <= maxDistanceMeters;
}

/**
 * Verifies an image embedding against encrypted answer embeddings.
 *
 * @param {string} ciphertext - Encrypted JSON array of answers
 * @param {string|number} clueId
 * @param {number[]} userEmbedding
 * @param {number} [similarityThreshold]
 * @returns {boolean}
 */
export function verifyImage(
  ciphertext,
  clueId,
  userEmbedding,
  similarityThreshold = DEFAULT_SIMILARITY_THRESHOLD
) {
  if (!Array.isArray(userEmbedding) || userEmbedding.length === 0) {
    throw new Error("userEmbedding must be a non-empty array");
  }

  const decrypted = decrypt(ciphertext);
  const answers = JSON.parse(decrypted);

  if (!Array.isArray(answers)) {
    throw new Error("Decrypted answers data is not an array");
  }

  const target = answers.find((answer) => answer.id === clueId);

  if (!target || !Array.isArray(target.embedding)) {
    return false;
  }

  const similarity = cosineSimilarity(userEmbedding, target.embedding);
  console.log("Cosine similarity:", similarity, "Threshold:", similarityThreshold);

  return similarity >= similarityThreshold;
}

