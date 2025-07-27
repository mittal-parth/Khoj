import { PinataSDK } from "pinata";
import dotenv from "dotenv";

dotenv.config();

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.PINATA_GATEWAY || "https://jade-bitter-duck-676.mypinata.cloud",
});

/**
 * Stores a string as a file on IPFS via Pinata
 * @param {string} text - The text content to store
 * @returns {Promise<string>} The CID of the stored content
 */
export async function storeString(text) {
  try {
    // Upload text as JSON to Pinata (Node.js compatible)
    console.log("pinata: Uploading to Pinata");
    const upload = await pinata.upload.public.json({ content: text });
    console.log("pinata: Uploaded to Pinata, CID: ", upload.cid);

    return upload.cid;
  } catch (error) {
    console.error("Error storing file:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * Reads an object from IPFS via Pinata gateway
 * @param {string} cid - The CID of the content to read
 * @returns {Promise<string>} The content of the file
 */
export async function readObject(cid) {
  try {
    // Read from Pinata Gateway using the SDK
    console.log("pinata: Reading from Pinata, CID: ", cid);
    const response = await pinata.gateways.public.get(cid);
    console.log("pinata: Done reading from Pinata, response: ", response.data.content);

    // Extract content from JSON structure
    if (response.data && typeof response.data === 'object' && response.data.content) {
      return response.data.content;
    }
    
    // Fallback: return raw data if not in expected JSON format
    return response.data;
  } catch (error) {
    console.error("Error reading file:", error.response?.data || error.message);
    throw error;
  }
}
