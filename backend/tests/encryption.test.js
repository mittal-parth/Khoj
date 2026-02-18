import dotenv from "dotenv";
dotenv.config();

import { encrypt, decrypt } from "../src/services/encryption.js";

function ensureTestKey() {
  if (!process.env.ENCRYPTION_KEY) {
    // Stable but obviously non-production key for tests
    process.env.ENCRYPTION_KEY =
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  }
}

describe("AES encryption service", () => {
  beforeAll(() => {
    ensureTestKey();
  });

  test("encrypt then decrypt round-trip returns original plaintext", () => {
    const plaintext = "hello khoj";
    const ciphertext = encrypt(plaintext);
    const decrypted = decrypt(ciphertext);

    expect(decrypted).toBe(plaintext);
  });

  test("different plaintexts produce different ciphertexts", () => {
    const a = "first message";
    const b = "second message";

    const ca = encrypt(a);
    const cb = encrypt(b);

    expect(ca).not.toBe(cb);
  });

  test("encrypting the same plaintext twice produces different ciphertexts (random IV)", () => {
    const plaintext = "same message";

    const c1 = encrypt(plaintext);
    const c2 = encrypt(plaintext);

    expect(c1).not.toBe(c2);
    expect(decrypt(c1)).toBe(plaintext);
    expect(decrypt(c2)).toBe(plaintext);
  });

  test("tampered ciphertext throws error on decrypt", () => {
    const plaintext = "do not tamper";
    const ciphertext = encrypt(plaintext);

    // Flip one byte in the base64 payload
    const buf = Buffer.from(ciphertext, "base64");
    buf[buf.length - 1] = buf[buf.length - 1] ^ 0xff;
    const tampered = buf.toString("base64");

    expect(() => decrypt(tampered)).toThrow();
  });

  test("empty string encrypt/decrypt round-trip", () => {
    const plaintext = "";
    const ciphertext = encrypt(plaintext);
    const decrypted = decrypt(ciphertext);

    expect(decrypted).toBe(plaintext);
  });

  test("unicode / JSON string encrypt/decrypt round-trip", () => {
    const obj = {
      message: "こんにちは, khoj 👋",
      nested: { value: 42 },
    };
    const plaintext = JSON.stringify(obj);

    const ciphertext = encrypt(plaintext);
    const decrypted = decrypt(ciphertext);

    expect(JSON.parse(decrypted)).toEqual(obj);
  });

  test("large payload (simulated embedding array) encrypt/decrypt round-trip", () => {
    const embedding = Array.from({ length: 512 }, (_, i) => i / 10);
    const payload = {
      id: "clue-1",
      answer: "some place",
      embedding,
    };

    const plaintext = JSON.stringify(payload);
    const ciphertext = encrypt(plaintext);
    const decrypted = decrypt(ciphertext);

    expect(JSON.parse(decrypted)).toEqual(payload);
  });
});

