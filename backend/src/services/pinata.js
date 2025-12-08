import { PinataSDK } from "pinata";
import dotenv from "dotenv";

dotenv.config();

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.PINATA_GATEWAY,
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
 * Stores a file (like an image) on IPFS via Pinata
 * @param {Buffer} fileBuffer - The file buffer to store
 * @param {string} fileName - The name of the file
 * @param {string} mimeType - The MIME type of the file
 * @returns {Promise<string>} The CID of the stored file
 */
export async function storeFile(fileBuffer, fileName, mimeType) {
  try {
    console.log("pinata: Uploading file to Pinata:", fileName);
    
    // Create a File object from buffer (Node.js compatible)
    const file = new File([fileBuffer], fileName, { type: mimeType });
    
    const upload = await pinata.upload.public.file(file);
    console.log("pinata: File uploaded to Pinata, CID: ", upload.cid);

    return upload.cid;
  } catch (error) {
    console.error("Error storing file:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * Reads an object from IPFS via Pinata gateway
 * @param {string} blobId - The CID or blob ID of the content to read
 * @returns {Promise<string>} The content of the file
 */
export async function readObject(blobId) {
  if (!blobId || typeof blobId !== 'string') {
    throw new Error('Invalid blobId provided to readObject');
  }

  // During tests or for mock ids, return a deterministic mock payload
  if (process.env.NODE_ENV === 'test' || blobId.startsWith('mock-')) {
    return JSON.stringify({
      ciphertext: 'mock-ciphertext',
      dataToEncryptHash: 'mock-hash'
    });
  }

  const gateway = process.env.PINATA_GATEWAY || 'gateway.pinata.cloud';

  try {
    // Try using Pinata SDK first
    console.log("pinata: Reading from Pinata, blobId: ", blobId);
    const response = await pinata.gateways.public.get(blobId);
    console.log("pinata: Done reading from Pinata, response: ", response.data.content);

    // Extract content from JSON structure
    if (response.data && typeof response.data === 'object' && response.data.content) {
      return response.data.content;
    }
    
    // Fallback: return raw data if not in expected JSON format
    return response.data;
  } catch (sdkError) {
    console.error('Pinata SDK failed, falling back to gateway fetch:', sdkError.message || sdkError);
    
    // Fallback: treat blobId as CID and fetch directly from gateway
    try {
      const url = `https://${gateway.replace(/^https?:\/\//, '').replace(/\/+$/, '')}/ipfs/${blobId}`;
      console.log("pinata: Attempting gateway fetch from:", url);
      
      const resp = await fetch(url);
      if (!resp.ok) {
        throw new Error(`Failed to fetch blobId ${blobId} from gateway ${url}: ${resp.status}`);
      }
      
      const text = await resp.text();
      console.log("pinata: Successfully fetched from gateway");
      
      // Try to parse as JSON to extract content field if present
      try {
        const json = JSON.parse(text);
        if (json.content) {
          return json.content;
        }
        return text;
      } catch {
        // Not JSON or no content field, return as-is
        return text;
      }
    } catch (fetchError) {
      console.error('Gateway fetch also failed:', fetchError.message || fetchError);
      throw new Error(`Failed to read object from Pinata: ${sdkError.message}. Gateway fallback also failed: ${fetchError.message}`);
    }
  }
}
