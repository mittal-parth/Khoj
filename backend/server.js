import express from "express";

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
import dotenv from "dotenv";
import cors from "cors";
import { parseJSON } from "./data_transform.js";

import { readObject, storeString } from "./pinata.js";
import {
  getRoomId,
  getToken,
  startStreaming,
  stopStreaming,
} from "./huddle.js";
// import haversineDistance from './haversine-distance.js';
const MAX_DISTANCE_IN_METERS = 50;

const corsOptions = {
  origin: "*", // Adjust this to your frontend's origin
  optionsSuccessStatus: 200,
};

dotenv.config();

const app = express();
app.use(cors()); // Add this line to enable CORS for all routes
app.use(express.json());
app.use(cors(corsOptions));

const port = process.env.PORT || 8000;
const userAddress = "0x7F23F30796F54a44a7A95d8f8c8Be1dB017C3397";
const client = new LitNodeClient({
  litNetwork: LitNetwork.DatilDev,
  debug: false,
});

const walletWithCapacityCredit = new Wallet(
    process.env.PRIVATE_KEY
);

const authSig = await (async () => {
  const toSign = await createSiweMessageWithRecaps({
    uri: "http://localhost",
    expiration: new Date(Date.now() + 1000 * 60 * 60).toISOString(), // 24 hours
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
    // disconnectWeb3();
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
      // console.log("authSig:", authSig);
      return authSig;
    };

    // const litResource = new LitAccessControlConditionResource('*');

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

  async decryptLitActionClues(ciphertext, dataToEncryptHash, userAddress) {
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
        parameters: [userAddress],
        returnValueTest: {
          comparator: ">",
          value: "0",
        },
      },
    ];

    const sessionSigs = await this.getSessionSigsServer();
    // // Decrypt the private key inside a lit action
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
    userAddress,
    cLat,
    cLong,
    clueId
  ) {
    const chain = "baseSepolia";

    const _litActionCode = async () => {
      const clues = await Lit.Actions.decryptAndCombine({
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
      const MAX_DISTANCE_IN_METERS = 50;

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
          const currentLocation = JSON.parse(clues).find(
            (location) => location.id === clueId
          );
          console.log("currentLocation: ", currentLocation);
          console.log("compare with: ", cLat, cLong);

          if (!currentLocation) {
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
        parameters: [userAddress],
        returnValueTest: {
          comparator: ">",
          value: "0",
        },
      },
    ];

    console.log(cLat, cLong, clueId);

    const sessionSigs = await this.getSessionSigsServer();
    // Decrypt the private key inside a lit action
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
        haversineDistance: MAX_DISTANCE_IN_METERS,
      },
    });
    console.log("result from action execution:", res);

    return res;
  }
}

export const encryptRunServerMode = async (message, userAddress) => {
  const chain = "baseSepolia";

  const accessControlConditions = [
    {
      contractAddress: "0x50Fe11213FA2B800C5592659690A38F388060cE4",
      standardContractType: "ERC721",
      chain,
      method: "balanceOf",
      parameters: [userAddress],
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

export const decryptRunServerMode = async (
  dataToEncryptHash,
  ciphertext,
  userAddress,
  cLat,
  cLong,
  clueId
) => {
  const chain = "baseSepolia";
  console.log("userAddress: ", userAddress);
  console.log("cLat: ", cLat);
  console.log("cLong: ", cLong);
  console.log("clueId: ", clueId);

  const accessControlConditions = [
    {
      contractAddress: "0x50Fe11213FA2B800C5592659690A38F388060cE4",
      standardContractType: "ERC721",
      chain,
      method: "balanceOf",
      parameters: [userAddress],
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
      userAddress,
      cLat,
      cLong,
      clueId
    );
  } else {
    console.log("decrypting clues");
    data = await myLit.decryptLitActionClues(
      ciphertext,
      dataToEncryptHash,
      userAddress
    );
  }

  return data;
};

export async function run() {
  // Sample clues array
  const clues = [
    { id: "clue1", lat: 12.9716, long: 77.5946 },
    // { id: "clue2", lat: 12.7041, long: 77.1025 },
  ];
  
  const clueId = "clue1";
  const cLat = 12.9716; // Same as clue1 for a positive match
  const cLong = 77.5946;

  //check for negative match
  const farLong = 10.5946; // Far away longitude for negative match
  const farLat = 10.9716; // Far away latitude for negative match

  // Encrypt the clues array
  const { ciphertext, dataToEncryptHash } = await encryptRunServerMode(
    JSON.stringify(clues),
    userAddress
  );

  // Test Lit clue verify function
  const result = await decryptRunServerMode(
    dataToEncryptHash,
    ciphertext,
    userAddress,
    // cLat,
    // cLong,
    // clueId
  );
  console.log("Positive Match Result:", result);

  // Test Lit clue verify function with negative match
  // const clueResult = await decryptRunServerMode(
  //   "bb41eeeedb7789a3482cc74a1ac8d84effb2a508b753948130e3958c39004120",
  //   "ptDRCbVUal2Y37ATZ7da3OSRb9OXLL08YQ2osDpIEMyOP9lFrGPf+bf1a4AfDWZZljZfjZ0d0EMZ9yvcgCcnCFaRycj70c8zQkI2bmGmAaQgNMFGV6+3PUWQ2uxnj1RLZcGZnjAhfKyvPNAkaZqkU+4C",
  //   userAddress

  // );
  // console.log("Clues Result:", clueResult);
}


app.post("/encrypt", async (req, res) => {
  const bodyData = req.body;

  if (!bodyData.userAddress || !bodyData.clues || !bodyData.answers) {
    return res.status(400).json({ error: "Missing required fields: userAddress, clues, and answers" });
  }

  

  if (!Array.isArray(bodyData.clues) || !Array.isArray(bodyData.answers)) {
    return res.status(400).json({ error: "Clues and answers must be arrays" });
  }

  
  const clues = bodyData.clues;
  const answers = bodyData.answers;

  // Validate clues
  for (const clue of clues) {
    if (!clue.id || !clue.description) {
      return res.status(400).json({ 
        error: "Each clue must have id and description fields"
      });
    }
  }

  // Validate answers
  for (const answer of answers) {
    if (!answer.id || !answer.answer || typeof answer.lat !== 'number' || typeof answer.long !== 'number') {
      return res.status(400).json({
        error: "Each answer must have id, answer, lat, and long fields"
      });
    }
  }

  // const userAddress = bodyData.userAddress;
  const cluesParsed = clues.map(({ id, description }) => ({
    id,
    description,
  }));
  const answersParsed = answers.map(({ id, answer, lat, long }) => ({
    id,
    answer,
    lat,
    long,
  }));

  console.log("cluesParsed: ", cluesParsed);
  console.log("answersParsed: ", answersParsed);

  const {
    ciphertext: clues_ciphertext,
    dataToEncryptHash: clues_dataToEncryptHash,
  } = await encryptRunServerMode(JSON.stringify(cluesParsed), userAddress);
  const {
    ciphertext: answers_ciphertext,
    dataToEncryptHash: answers_dataToEncryptHash,
  } = await encryptRunServerMode(JSON.stringify(answersParsed), userAddress);


  const [clues_blobId, answers_blobId] = await Promise.all([
    storeString(JSON.stringify({
      ciphertext : clues_ciphertext,
      dataToEncryptHash : clues_dataToEncryptHash,
    })),
    storeString(JSON.stringify({
      ciphertext : answers_ciphertext,
      dataToEncryptHash : answers_dataToEncryptHash,
    })),
  ]);

  res.send({ clues_blobId: clues_blobId, answers_blobId: answers_blobId });
});
app.post("/decrypt-ans", async (req, res) => {
  const bodyData = req.body;
  const curLat = bodyData.cLat;
  const curLong = bodyData.cLong;
  const clueId = bodyData.clueId;

 
  const {
    ciphertext: answers_ciphertext,
    dataToEncryptHash: answers_dataToEncryptHash,
  } = await readObject(bodyData.answers_blobId);

  console.log("userAddress: ", bodyData.userAddress);
  console.log("answers_dataToEncryptHash: ", answers_dataToEncryptHash);

  const { response } = await decryptRunServerMode(
    answers_dataToEncryptHash,
    answers_ciphertext,
    bodyData.userAddress,
    curLat,
    curLong,
    clueId
  );

  res.send({ isClose: response });
});

app.post("/decrypt-clues", async (req, res) => {
  try {
    const bodyData = req.body;
    const clues_blobId = bodyData.clues_blobId;
    // const userAddress = bodyData.userAddress;

    const {
      ciphertext: clues_ciphertext,
      dataToEncryptHash: clues_dataToEncryptHash,
    } = await readObject(clues_blobId);

    console.log("clues_dataToEncryptHash: ", clues_dataToEncryptHash);
    console.log("clues_ciphertext: ", clues_ciphertext);

    const { response } = await decryptRunServerMode(
      clues_dataToEncryptHash,
      clues_ciphertext,
      userAddress,
  
    );
    res.send({ decryptedData: JSON.parse(response) });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      error: "Failed to decrypt clues",
    });
  }
});

app.post("/startHuddle", async (req, res) => {
  try {
    const roomId = await getRoomId();
    const token = await getToken(roomId);
    res.json({
      roomId: roomId,
      token: token,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      error: "Failed to create room or generate token",
    });
  }
});

app.post("/livestreams/start", async (req, res) => {
  const bodyData = req.body;
  console.log("BackendbodyData: ", bodyData);
  await startStreaming(
    bodyData.roomId,
    bodyData.token,
    bodyData.streamUrl,
    bodyData.streamKey
  );
  res.send({ message: "Streaming started" });
});

app.post("/livestreams/stop", async (req, res) => {
  const bodyData = req.body;
  console.log("Backend bodyData: ", bodyData);
  await stopStreaming(bodyData.roomId);
  res.send({ message: "Streaming stopped" });
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});

// run().catch(console.error)
