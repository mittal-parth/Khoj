// Lit Protocol service - handles encryption/decryption using Lit Protocol

import dotenv from "dotenv";
dotenv.config();

import { getWebCrypto } from './lit-protocol-patch.js';

// Make sure crypto is available in the global scope
if (typeof global.crypto === 'undefined' || !global.crypto.subtle) {
  const webCrypto = getWebCrypto();
  // Use Object.defineProperty to avoid errors with getters
  if (!global.crypto) {
    Object.defineProperty(global, 'crypto', {
      value: webCrypto,
      writable: false,
      configurable: false
    });
  } else if (!global.crypto.subtle) {
    // Just add the subtle property if missing
    Object.defineProperty(global.crypto, 'subtle', {
      value: webCrypto.subtle,
      writable: false,
      configurable: false
    });
  }
}

import {
  encryptString,
  decryptToString,
  LitNodeClient,
} from "@lit-protocol/lit-node-client";
import { Wallet } from "ethers";
import {
  LitActionResource,
  LitAccessControlConditionResource,
  LitAbility,
  createSiweMessageWithRecaps,
  generateAuthSig,
} from "@lit-protocol/auth-helpers";
import { LitNetwork } from "@lit-protocol/constants";
import { SIMILARITY_THRESHOLD } from "./vertex-ai.js";

// Configuration
const MAX_DISTANCE_IN_METERS = parseFloat(process.env.MAX_DISTANCE_IN_METERS) || 60;

// Server wallet address used for access control conditions
// IMPORTANT: This address is used for BOTH encryption AND decryption access control conditions
// They must match for Lit Protocol to successfully decrypt data
const serverWalletAddress = process.env.LIT_WALLET_PUBLIC_ADDRESS || "0x7F23F30796F54a44a7A95d8f8c8Be1dB017C3397";

// Initialize Lit Node Client
const client = new LitNodeClient({
  litNetwork: LitNetwork.DatilDev,
  debug: false,
});

// Initialize wallet with capacity credit
const walletWithCapacityCredit = new Wallet(process.env.LIT_WALLET_PRIVATE_KEY);

// Generate auth signature
const authSig = await (async () => {
  const toSign = await createSiweMessageWithRecaps({
    uri: `http://${process.env.HOST === '0.0.0.0' ? 'localhost' : (process.env.HOST || 'localhost')}:${process.env.PORT || 8000}`,
    expiration: new Date(Date.now() + 1000 * 60 * 60).toISOString(), // 1 hour
    walletAddress: walletWithCapacityCredit.address,
    nonce: await client.getLatestBlockhash(),
    resources: [
      {
        resource: new LitActionResource("*"),
        ability: LitAbility.LitActionExecution,
      },
      {
        resource: new LitAccessControlConditionResource("*"),
        ability: LitAbility.AccessControlConditionDecryption,
      },
    ],
    litNodeClient: client,
  });
  return await generateAuthSig({
    signer: walletWithCapacityCredit,
    toSign,
  });
})();

export class Lit {
  litNodeClient;
  accessControlConditions;
  chain;

  constructor(client, chain, accessControlConditions) {
    this.litNodeClient = client;
    this.chain = chain;
    this.accessControlConditions = accessControlConditions;
  }

  async connect() {
    await this.litNodeClient.connect();
  }

  async disconnect() {
    await this.litNodeClient.disconnect();
  }

  async getSessionSigsServer() {
    const latestBlockhash = await this.litNodeClient.getLatestBlockhash();

    const authNeededCallback = async (params) => {
      if (!params.uri) {
        throw new Error("uri is required");
      }
      if (!params.expiration) {
        throw new Error("expiration is required");
      }
      if (!params.resourceAbilityRequests) {
        throw new Error("resourceAbilityRequests is required");
      }

      const toSign = await createSiweMessageWithRecaps({
        uri: params.uri,
        expiration: params.expiration,
        resources: params.resourceAbilityRequests,
        walletAddress: walletWithCapacityCredit.address,
        nonce: latestBlockhash,
        litNodeClient: this.litNodeClient,
      });

      const authSig = await generateAuthSig({
        signer: walletWithCapacityCredit,
        toSign,
      });
      return authSig;
    };

    const sessionSigs = await this.litNodeClient.getSessionSigs({
      chain: this.chain,
      resourceAbilityRequests: [
        {
          resource: new LitActionResource("*"),
          ability: LitAbility.LitActionExecution,
        },
        {
          resource: new LitAccessControlConditionResource("*"),
          ability: LitAbility.AccessControlConditionDecryption,
        },
      ],
      authNeededCallback,
    });
    console.log("sessionSigs:", sessionSigs);
    return sessionSigs;
  }

  async encrypt(message) {
    // Log message summary without embeddings to avoid flooding logs
    try {
      const parsed = JSON.parse(message);
      if (Array.isArray(parsed) && parsed.some(item => item.embedding)) {
        const summary = parsed.map(item => ({
          id: item.id,
          answer: item.answer,
          description: item.description,
          hasEmbedding: !!item.embedding,
          embeddingLength: item.embedding?.length,
          lat: item.lat,
          long: item.long
        }));
        console.log("encrypting message (summary):", JSON.stringify(summary), typeof message);
      } else {
        console.log("encrypting message:", message, typeof message);
      }
    } catch {
      console.log("encrypting message:", message, typeof message);
    }
    const sessionSigs = await this.getSessionSigsServer();
    console.log(sessionSigs);
    const { ciphertext, dataToEncryptHash } = await encryptString(
      {
        accessControlConditions: this.accessControlConditions,
        chain: this.chain,
        dataToEncrypt: message,
        sessionSigs,
      },
      this.litNodeClient
    );
    return {
      ciphertext,
      dataToEncryptHash,
    };
  }

  async decrypt(ciphertext, dataToEncryptHash) {
    const sessionSigs = await this.getSessionSigsServer();
    console.log(sessionSigs);

    const decryptedString = await decryptToString(
      {
        accessControlConditions: [this.accessControlConditions],
        chain: this.chain,
        ciphertext,
        dataToEncryptHash,
        sessionSigs,
        authSig,
      },
      this.litNodeClient
    );
    return { decryptedString };
  }

  async decryptLitActionClues(ciphertext, dataToEncryptHash, accessControlAddress) {
    const chain = "baseSepolia";

    const code = `(async () => {
            const clues = await Lit.Actions.decryptAndCombine({
              accessControlConditions,
              chain: "baseSepolia",
              ciphertext,
              dataToEncryptHash,
              authSig,
              sessionSigs
            });
            console.log("clues: ", clues);   

            Lit.Actions.setResponse({ response: clues });
          })();`;

    const accessControlConditions = [
      {
        contractAddress: "0x50Fe11213FA2B800C5592659690A38F388060cE4",
        standardContractType: "ERC721",
        chain,
        method: "balanceOf",
        parameters: [accessControlAddress],
        returnValueTest: {
          comparator: ">",
          value: "0",
        },
      },
    ];

    const sessionSigs = await this.getSessionSigsServer();
    const res = await this.litNodeClient.executeJs({
      sessionSigs,
      code: code,
      jsParams: {
        accessControlConditions: accessControlConditions,
        ciphertext,
        dataToEncryptHash,
        sessionSigs,
        authSig,
      },
    });
    console.log("result from action execution:", res);

    return res;
  }

  async decryptLitActionVerify(
    ciphertext,
    dataToEncryptHash,
    accessControlAddress,
    cLat,
    cLong,
    clueId,
  ) {
    const chain = "baseSepolia";

    const _litActionCode = async () => {
      const answers = await Lit.Actions.decryptAndCombine({
        accessControlConditions,
        chain: "baseSepolia",
        ciphertext,
        dataToEncryptHash,
        authSig,
        sessionSigs,
      });

      const asin = Math.asin;
      const cos = Math.cos;
      const sin = Math.sin;
      const sqrt = Math.sqrt;
      const PI = Math.PI;

      // equatorial mean radius of Earth (in meters)
      const R = 6378137;

      function squared(x) {
        return x * x;
      }
      function toRad(x) {
        return (x * PI) / 180.0;
      }
      function hav(x) {
        return squared(sin(x / 2));
      }

      // hav(theta) = hav(bLat - aLat) + cos(aLat) * cos(bLat) * hav(bLon - aLon)
      function haversineDistance(a, b) {
        console.log("haversineDistance: ", a, b);
        const aLat = toRad(Array.isArray(a) ? a[1] : a.latitude ?? a.lat);
        const bLat = toRad(Array.isArray(b) ? b[1] : b.latitude ?? b.lat);
        const aLng = toRad(
          Array.isArray(a) ? a[0] : a.longitude ?? a.lng ?? a.lon
        );
        const bLng = toRad(
          Array.isArray(b) ? b[0] : b.longitude ?? b.lng ?? b.lon
        );

        const ht = hav(bLat - aLat) + cos(aLat) * cos(bLat) * hav(bLng - aLng);
        return 2 * R * asin(sqrt(ht));
      }

      const isLocationInProximity = await Lit.Actions.runOnce(
        { waitForResponse: true, name: "ETH block number" },
        async () => {
          console.log("answers: ", answers);
          const currentLocation = JSON.parse(answers).find(
            (answer) => answer.id === clueId
          );
          console.log("currentLocation: ", currentLocation);
          console.log("compare with: ", cLat, cLong);

          if (!currentLocation) {
            console.log("No location found for clueId:", clueId);
            return false;
          }

          const distance = haversineDistance(
            { lat: currentLocation.lat, lng: currentLocation.long },
            { lat: cLat, lng: cLong }
          );

          console.log("distance: ", distance);
          return distance <= MAX_DISTANCE_IN_METERS;
        }
      );

      Lit.Actions.setResponse({ response: isLocationInProximity });
    };

    const code = `(${_litActionCode.toString()})();`;

    const accessControlConditions = [
      {
        contractAddress: "0x50Fe11213FA2B800C5592659690A38F388060cE4",
        standardContractType: "ERC721",
        chain,
        method: "balanceOf",
        parameters: [accessControlAddress],
        returnValueTest: {
          comparator: ">",
          value: "0",
        },
      },
    ];

    console.log(cLat, cLong, clueId);

    const sessionSigs = await this.getSessionSigsServer();
    const res = await this.litNodeClient.executeJs({
      sessionSigs,
      code: code,
      jsParams: {
        accessControlConditions: accessControlConditions,
        ciphertext,
        dataToEncryptHash,
        sessionSigs,
        authSig,
        clueId: clueId,
        cLat: cLat,
        cLong: cLong,
        MAX_DISTANCE_IN_METERS: MAX_DISTANCE_IN_METERS,
      },
    });
    console.log("result from action execution:", res);

    return res;
  }

  async decryptLitActionVerifyImage(
    ciphertext,
    dataToEncryptHash,
    accessControlAddress,
    userEmbedding,
    clueId,
    similarityThreshold
  ) {
    const chain = "baseSepolia";

    const _litActionCode = async () => {
      const answers = await Lit.Actions.decryptAndCombine({
        accessControlConditions,
        chain: "baseSepolia",
        ciphertext,
        dataToEncryptHash,
        authSig,
        sessionSigs,
      });

      // Cosine similarity calculation
      function cosineSimilarity(a, b) {
        if (!a || !b || a.length !== b.length) {
          console.log("Invalid embeddings for cosine similarity");
          return 0;
        }
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < a.length; i++) {
          dotProduct += a[i] * b[i];
          normA += a[i] * a[i];
          normB += b[i] * b[i];
        }
        if (normA === 0 || normB === 0) {
          return 0;
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
      }

      const isImageMatch = await Lit.Actions.runOnce(
        { waitForResponse: true, name: "image verification" },
        async () => {
          const answersArray = JSON.parse(answers);
          // Log answer summary without embeddings to avoid flooding logs
          const answersSummary = answersArray.map(a => ({
            id: a.id,
            answer: a.answer,
            hasEmbedding: !!a.embedding,
            embeddingLength: a.embedding?.length
          }));
          console.log("answers summary:", JSON.stringify(answersSummary));
          
          const answerData = answersArray.find((answer) => answer.id === clueId);
          console.log("Found answer for clueId", clueId, ":", answerData ? { id: answerData.id, answer: answerData.answer, hasEmbedding: !!answerData.embedding } : null);

          if (!answerData || !answerData.embedding) {
            console.log("No embedding found for clueId:", clueId);
            return false;
          }

          console.log("User embedding length:", userEmbedding.length);
          console.log("Stored embedding length:", answerData.embedding.length);

          const similarity = cosineSimilarity(userEmbedding, answerData.embedding);
          console.log("Cosine similarity:", similarity, "Threshold:", SIMILARITY_THRESHOLD);
          return similarity >= SIMILARITY_THRESHOLD;
        }
      );

      Lit.Actions.setResponse({ response: isImageMatch });
    };

    const code = `(${_litActionCode.toString()})();`;

    const accessControlConditions = [
      {
        contractAddress: "0x50Fe11213FA2B800C5592659690A38F388060cE4",
        standardContractType: "ERC721",
        chain,
        method: "balanceOf",
        parameters: [accessControlAddress],
        returnValueTest: {
          comparator: ">",
          value: "0",
        },
      },
    ];

    console.log("Image verification - clueId:", clueId, "threshold:", similarityThreshold);

    const sessionSigs = await this.getSessionSigsServer();
    const res = await this.litNodeClient.executeJs({
      sessionSigs,
      code: code,
      jsParams: {
        accessControlConditions: accessControlConditions,
        ciphertext,
        dataToEncryptHash,
        sessionSigs,
        authSig,
        clueId: clueId,
        userEmbedding: userEmbedding,
        SIMILARITY_THRESHOLD: similarityThreshold,
      },
    });
    // Log result summary without full logs to avoid flooding with embedding data
    console.log("result from image verification action execution:", {
      success: res.success,
      response: res.response,
      signedData: res.signedData,
      decryptedData: res.decryptedData,
      claimData: res.claimData,
      logs: res.logs ? `[${res.logs.length} chars - check for similarity in logs]` : undefined
    });
    // Extract and log just the similarity line from logs if present
    if (res.logs) {
      const similarityMatch = res.logs.match(/Cosine similarity:\s*([\d.]+)/);
      if (similarityMatch) {
        console.log("Extracted cosine similarity:", similarityMatch[1]);
      }
    }

    return res;
  }
}

/**
 * Encrypts a message using Lit Protocol with server's access control conditions
 * @param {string} message - The message to encrypt
 * @returns {Promise<{ciphertext: string, dataToEncryptHash: string}>}
 */
export const encryptRunServerMode = async (message) => {
  const chain = "baseSepolia";

  const accessControlConditions = [
    {
      contractAddress: "0x50Fe11213FA2B800C5592659690A38F388060cE4",
      standardContractType: "ERC721",
      chain,
      method: "balanceOf",
      parameters: [serverWalletAddress],
      returnValueTest: {
        comparator: ">",
        value: "0",
      },
    },
  ];

  let myLit = new Lit(client, chain, accessControlConditions);
  await myLit.connect();

  const { ciphertext, dataToEncryptHash } = await myLit.encrypt(
    message,
    "server"
  );
  console.log("ciphertext: ", ciphertext);
  console.log("dataToEncryptHash: ", dataToEncryptHash);

  return { ciphertext, dataToEncryptHash };
};

/**
 * Decrypts data using Lit Protocol
 * Uses server's wallet address for access control to match encryption conditions
 * @param {string} dataToEncryptHash - Hash of the encrypted data
 * @param {string} ciphertext - The encrypted ciphertext
 * @param {number} [cLat] - Current latitude for location verification (geolocation hunts)
 * @param {number} [cLong] - Current longitude for location verification (geolocation hunts)
 * @param {string|number} [clueId] - Clue ID for verification
 * @param {string} [huntType="GEO_LOCATION"] - Hunt type: "GEO_LOCATION" or "IMAGE"
 * @param {number[]} [userEmbedding=null] - User's image embedding for image verification
 * @returns {Promise<Object>} Decryption result
 */
export const decryptRunServerMode = async (
  dataToEncryptHash,
  ciphertext,
  cLat,
  cLong,
  clueId,
  huntType = "GEO_LOCATION",
  userEmbedding = null
) => {
  const chain = "baseSepolia";
  console.log("\n=== Lit Protocol: DECRYPT RUN SERVER MODE DEBUG ===\n");
  console.log("huntType: ", huntType);
  console.log("clueId: ", clueId);
  if (huntType === "IMAGE") {
    console.log("userEmbedding length: ", userEmbedding?.length);
  } else {
    console.log("cLat: ", cLat);
    console.log("cLong: ", cLong);
  }

  // IMPORTANT: Use serverWalletAddress for access control conditions
  // This must match the address used during encryption
  const accessControlConditions = [
    {
      contractAddress: "0x50Fe11213FA2B800C5592659690A38F388060cE4",
      standardContractType: "ERC721",
      chain,
      method: "balanceOf",
      parameters: [serverWalletAddress],
      returnValueTest: {
        comparator: ">",
        value: "0",
      },
    },
  ];

  let myLit = new Lit(client, chain, accessControlConditions);
  await myLit.connect();

  let data;

  if (clueId) {
    if (huntType === "IMAGE" && userEmbedding) {
      // Image verification using cosine similarity
      console.log("Using image verification with cosine similarity");
      data = await myLit.decryptLitActionVerifyImage(
        ciphertext,
        dataToEncryptHash,
        serverWalletAddress,
        userEmbedding,
        clueId,
        SIMILARITY_THRESHOLD
      );
    } else {
      // Geolocation verification using haversine distance
      console.log("Using geolocation verification with haversine distance");
      data = await myLit.decryptLitActionVerify(
        ciphertext,
        dataToEncryptHash,
        serverWalletAddress,
        cLat,
        cLong,
        clueId
      );
    }
  } else {
    console.log("decrypting clues");
    data = await myLit.decryptLitActionClues(
      ciphertext,
      dataToEncryptHash,
      serverWalletAddress
    );
  }

  return data;
};
