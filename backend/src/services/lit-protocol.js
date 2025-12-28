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
    console.log("encrypting message: ", message, typeof message);
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
 * @param {number} [cLat] - Current latitude for location verification
 * @param {number} [cLong] - Current longitude for location verification
 * @param {string|number} [clueId] - Clue ID for location verification
 * @returns {Promise<Object>} Decryption result
 */
export const decryptRunServerMode = async (
  dataToEncryptHash,
  ciphertext,
  cLat,
  cLong,
  clueId
) => {
  const chain = "baseSepolia";
  console.log("\n=== Lit Protocol: DECRYPT RUN SERVER MODE DEBUG ===\n");
  console.log("cLat: ", cLat);
  console.log("cLong: ", cLong);
  console.log("clueId: ", clueId);

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
    data = await myLit.decryptLitActionVerify(
      ciphertext,
      dataToEncryptHash,
      serverWalletAddress,
      cLat,
      cLong,
      clueId
    );
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
