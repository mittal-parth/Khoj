import express from "express"

import { encryptString, decryptToString, LitNodeClient } from "@lit-protocol/lit-node-client";
import { Wallet } from "ethers";
import {
    LitActionResource,
    LitAccessControlConditionResource,
    LitAbility,
    createSiweMessageWithRecaps,
    generateAuthSig,
} from "@lit-protocol/auth-helpers"
import { LitNetwork } from "@lit-protocol/constants";
import dotenv from 'dotenv';
import cors from 'cors';
import { parseJSON} from './data_transform.js';
import { readObject, storeString } from "./walrus.js";
import { getRoomId, getToken, startStreaming, stopStreaming } from "./huddle.js";

const corsOptions = {
    origin: 'http://localhost:5173', // Adjust this to your frontend's origin
    optionsSuccessStatus: 200
};

dotenv.config({ path: './.env' });

const app = express();
app.use(cors());  // Add this line to enable CORS for all routes
app.use(express.json());
app.use(cors(corsOptions));

const port = process.env.PORT || 8000;

const client = new LitNodeClient({
    litNetwork: LitNetwork.DatilDev,
    debug: true,
});

// console.log(process.env.PRIVATE_KEY)
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
                resource: new LitActionResource('*'),
                ability: LitAbility.LitActionExecution,
            },
            {
                resource: new LitAccessControlConditionResource('*'),
                ability: LitAbility.AccessControlConditionDecryption,
            }
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
        await this.litNodeClient.connect()
    }

    async disconnect() {
        await this.litNodeClient.disconnect()
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
        }

        // const litResource = new LitAccessControlConditionResource('*');

        const sessionSigs = await this.litNodeClient.getSessionSigs({
            chain: this.chain,
            resourceAbilityRequests: [
                {
                    resource: new LitActionResource('*'),
                    ability: LitAbility.LitActionExecution,
                },
                {
                    resource: new LitAccessControlConditionResource('*'),
                    ability: LitAbility.AccessControlConditionDecryption,
                }
            ],
            authNeededCallback,
        });
        console.log("sessionSigs:", sessionSigs);
        return sessionSigs
    }

    async encrypt(message) {
        console.log("encrypting message: ", message, typeof message);
        const sessionSigs = await this.getSessionSigsServer();
        console.log(sessionSigs)
        const { ciphertext, dataToEncryptHash } = await encryptString(
            {
                accessControlConditions: this.accessControlConditions,
                chain: this.chain,
                dataToEncrypt: message,
                sessionSigs,
            },
            this.litNodeClient,
        );
        return {
            ciphertext,
            dataToEncryptHash,
        };
    }

    async decrypt(ciphertext, dataToEncryptHash) {
        const sessionSigs = await this.getSessionSigsServer();
        console.log(sessionSigs)

        const decryptedString = await decryptToString(
            {
                accessControlConditions: [this.accessControlConditions],
                chain: this.chain,
                ciphertext,
                dataToEncryptHash,
                sessionSigs,
                authSig,
            },
            this.litNodeClient,
        );
        return { decryptedString }
    }

    async decryptLitAction(ciphertext, dataToEncryptHash, userAddress) {
        const chain = "baseSepolia";

        const code = `(async () => {
            console.log("hello");
            const privateKey = await Lit.Actions.decryptAndCombine({
              accessControlConditions,
              chain: "baseSepolia",
              ciphertext,
              dataToEncryptHash,
              authSig,
              sessionSigs
            });
            console.log("privateKey: ", privateKey);
            Lit.Actions.setResponse({ response: privateKey });
          })();`

        const accessControlConditions = [
            {
                contractAddress: '0x50Fe11213FA2B800C5592659690A38F388060cE4',
                standardContractType: 'ERC721',
                chain,
                method: 'ownerOf',
                parameters: [
                    '4'
                ],
                returnValueTest: {
                    comparator: '=',
                    value: userAddress
                }
            }
        ]

        const sessionSigs = await this.getSessionSigsServer();
        // // Decrypt the private key inside a lit action
        const res = await this.litNodeClient.executeJs({
            sessionSigs,
            code: code,
            // code: genActionSource2(),
            jsParams: {
                accessControlConditions: accessControlConditions,
                ciphertext,
                dataToEncryptHash,
                sessionSigs,
                authSig
            }
        });
        console.log("result from action execution:", res);

        return res.response;
    }
}

export const encryptRunServerMode = async (message, userAddress) => {
    const chain = "baseSepolia";

    const accessControlConditions = [
        {
            contractAddress: '0x50Fe11213FA2B800C5592659690A38F388060cE4',
            standardContractType: 'ERC721',
            chain,
            method: 'ownerOf',
            parameters: [
                '4'
            ],
            returnValueTest: {
                comparator: '=',
                value: userAddress
            }
        }
    ]

    let myLit = new Lit(client, chain, accessControlConditions);
    await myLit.connect();

    const { ciphertext, dataToEncryptHash } = await myLit.encrypt(message, "server");
    console.log("ciphertext: ", ciphertext);
    console.log("dataToEncryptHash: ", dataToEncryptHash);

    return { ciphertext, dataToEncryptHash };
};

export const decryptRunServerMode = async (dataToEncryptHash, ciphertext, userAddress) => {
    const chain = "baseSepolia";

    const accessControlConditions = [
        {
            contractAddress: '0x50Fe11213FA2B800C5592659690A38F388060cE4',
            standardContractType: 'ERC721',
            chain,
            method: 'ownerOf',
            parameters: [
                '4'
            ],
            returnValueTest: {
                comparator: '=',
                value: userAddress
            }
        }
    ]

    let myLit = new Lit(client, chain, accessControlConditions);
    // await myLit.connect();userAddress

    const data = await myLit.decryptLitAction(ciphertext, dataToEncryptHash, userAddress);
    console.log("decrypted data: ", data);

    return (data)
}

export async function run() {
    const message = "Hello, Lit Protocol!";

    // Encrypt the message
    const { ciphertext, dataToEncryptHash } = await encryptRunServerMode(message, "0x7F23F30796F54a44a7A95d8f8c8Be1dB017C3397");

    // Decrypt the message
    const decryptedData = await decryptRunServerMode(dataToEncryptHash, ciphertext, "0x7F23F30796F54a44a7A95d8f8c8Be1dB017C3397");
    console.log("Decrypted Data:", decryptedData);
    return decryptedData;
}


// run().catch(console.error);

app.post('/encrypt', async (req, res) => {
    const bodyData = req.body;
    const userAddress = bodyData.userAddress;
    const [locations, cluesParsed] = parseJSON(bodyData.clues);
    console.log(JSON.stringify(locations), JSON.stringify(cluesParsed));

    const { ciphertext: lat_lang_ciphertext, dataToEncryptHash: lat_lang_dataToEncryptHash } = await encryptRunServerMode(JSON.stringify(locations), userAddress);
    const { ciphertext: clue_ciphertext, dataToEncryptHash: clue_dataToEncryptHash } = await encryptRunServerMode(JSON.stringify(cluesParsed), userAddress);

    //add to walrus
    const combinedObjects = [
        {
            ciphertext: lat_lang_ciphertext,
            dataToEncryptHash: lat_lang_dataToEncryptHash
        },
        {
            ciphertext: clue_ciphertext,
            dataToEncryptHash: clue_dataToEncryptHash
        }
    ];

    console.log(JSON.stringify(combinedObjects[0]))

    const [lat_lang_blobId, clue_blobId] = await Promise.all([
        storeString(JSON.stringify(combinedObjects[0])),
        storeString(JSON.stringify(combinedObjects[1]))
    ]);

    res.send({ "lat_lang_blobId": lat_lang_blobId, "clue_blobId": clue_blobId});
});
app.post('/decrypt-ans', async (req, res) => {
    const bodyData = req.body;

    const combinedObjectsBlobId = bodyData.lat_lang_blobId;
    // const clue_blobId = bodyData.clue_blobId;

    const { ciphertext: lat_lang_ciphertext, dataToEncryptHash: lat_lang_dataToEncryptHash } = await readObject(combinedObjectsBlobId);

    console.log("userAddress: ", bodyData.userAddress);
    console.log("lat_lang_dataToEncryptHash: ", lat_lang_dataToEncryptHash);

    const decryptedData = await decryptRunServerMode(lat_lang_dataToEncryptHash, lat_lang_ciphertext, bodyData.userAddress);

    res.send({ "decryptedData": decryptedData });
});


app.post('/decrypt-clues', async (req, res) => {
    const bodyData = req.body;
    const clue_blobId = bodyData.clue_blobId;
    const userAddress = bodyData.userAddress;
    const { ciphertext: clue_ciphertext, dataToEncryptHash: clue_dataToEncryptHash } = await readObject(clue_blobId);
    const decryptedData = await decryptRunServerMode(clue_dataToEncryptHash, clue_ciphertext, userAddress);
    res.send({ "decryptedData": decryptedData });
});


app.post('/startHuddle', async (req, res) => {
    try {
        const roomId = await getRoomId();
        const token = await getToken(roomId);
        res.json({ 
            roomId: roomId, 
            token: token 
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            error: 'Failed to create room or generate token' 
        });
    }
});

app.post('/livestreams/start', async (req, res) => {
    const bodyData = req.body;
    console.log("BackendbodyData: ", bodyData);
    await startStreaming(bodyData.roomId, bodyData.token, bodyData.streamUrl, bodyData.streamKey);
    res.send({ "message": "Streaming started" });
});

app.post('/livestreams/stop', async (req, res) => {
    const bodyData = req.body;
    console.log("Backend bodyData: ", bodyData);
    await stopStreaming(bodyData.roomId);
    res.send({ "message": "Streaming stopped" });
});


app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});