import { PinataSDK } from 'pinata';
import dotenv from 'dotenv';

dotenv.config();

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.PINATA_GATEWAY || "https://gateway.pinata.cloud"
});

/**
 * Stores a string as a file on IPFS via Pinata
 * @param {string} text - The text content to store
 * @returns {Promise<string>} The CID of the stored content
 */
export async function storeString(text) {
  try {
    // Create a Blob from the text
    const blob = new Blob([text], { type: 'text/plain' });
    const file = new File([blob], 'data.txt', { type: 'text/plain' });

    // Upload to Pinata using the SDK
    console.log("pinata: Uploading to Pinata");
    const upload = await pinata.upload.public.file(file);
    console.log("pinata: Uploaded to Pinata");
    // console.log('pinata: Store Response:', JSON.stringify(upload, null, 2));
    
    return upload.cid;
  } catch (error) {
    console.error('Error storing file:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Reads an object from IPFS via Pinata gateway
 * @param {string} cid - The CID of the content to read
 * @returns {Promise<any>} The content of the file
 */
export async function readObject(cid) {
  try {
    // Read from Pinata Gateway using the SDK
    console.log("pinata: Reading from Pinata, CID: ", cid);
    const response = await pinata.gateways.public.get(cid);
    console.log("pinata: Done reading from Pinata");

    return response.data;
  } catch (error) {
    console.error('Error reading file:', error.response?.data || error.message);
    throw error;
  }
} 

async function run() {
  await storeString("test")
}

run()