import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH_BYTES = 32; // 256 bits
const IV_LENGTH_BYTES = 12; // Recommended IV length for GCM
const AUTH_TAG_LENGTH_BYTES = 16;

function getKey() {
  const keyHex = process.env.ENCRYPTION_KEY;

  if (!keyHex) {
    throw new Error(
      "ENCRYPTION_KEY env var is not set. Generate one with `openssl rand -hex 32` and restart the server."
    );
  }

  const key = Buffer.from(keyHex, "hex");

  if (key.length !== KEY_LENGTH_BYTES) {
    throw new Error(
      `ENCRYPTION_KEY must be ${KEY_LENGTH_BYTES} bytes (${KEY_LENGTH_BYTES * 2} hex chars). Got ${key.length} bytes.`
    );
  }

  return key;
}

/**
 * Encrypt a UTF-8 string using AES-256-GCM.
 * Returns a base64 string packing IV + authTag + ciphertext.
 *
 * @param {string} plaintext
 * @returns {string} base64(IV || authTag || ciphertext)
 */
export function encrypt(plaintext) {
  if (typeof plaintext !== "string") {
    throw new TypeError("encrypt() expects a string");
  }

  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH_BYTES);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Layout: [ IV (12 bytes) | authTag (16 bytes) | ciphertext (N bytes) ]
  return Buffer.concat([iv, authTag, ciphertext]).toString("base64");
}

/**
 * Decrypt a base64 string produced by encrypt().
 *
 * @param {string} packed base64(IV || authTag || ciphertext)
 * @returns {string} plaintext UTF-8 string
 */
export function decrypt(packed) {
  if (typeof packed !== "string") {
    throw new TypeError("decrypt() expects a string");
  }

  const buf = Buffer.from(packed, "base64");

  // Minimum length is IV + authTag; ciphertext may be zero-length for empty input
  if (buf.length < IV_LENGTH_BYTES + AUTH_TAG_LENGTH_BYTES) {
    throw new Error("Invalid ciphertext payload");
  }

  const key = getKey();
  const iv = buf.subarray(0, IV_LENGTH_BYTES);
  const authTag = buf.subarray(
    IV_LENGTH_BYTES,
    IV_LENGTH_BYTES + AUTH_TAG_LENGTH_BYTES
  );
  const ciphertext = buf.subarray(IV_LENGTH_BYTES + AUTH_TAG_LENGTH_BYTES);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted =
    decipher.update(ciphertext, undefined, "utf8") + decipher.final("utf8");

  return decrypted;
}

