import {
  SignProtocolClient,
  SpMode,
  OffChainSignType,
  EvmChains,
  IndexService,
} from "@ethsign/sp-sdk";
import { privateKeyToAccount } from "viem/accounts";
import dotenv from "dotenv";

dotenv.config();

// Initialize Sign Protocol client in hybrid mode
const client = new SignProtocolClient(SpMode.OffChain, {
  signType: OffChainSignType.EvmEip712,
  account: privateKeyToAccount(process.env.SIGN_WALLET_PRIVATE_KEY),
  chain: EvmChains.optimismSepolia,
  apiKey: process.env.SIGN_API_KEY,
});

// Initialize Index Service for querying attestations
const indexService = new IndexService('mainnet');

// Schema definition for clue solving attestations
const CLUE_SCHEMA = {
  name: "Khoj Clue Solve",
  description: "Attestation for when a team solves a clue in a Khoj hunt",
  data: [
    { name: "teamIdentifier", type: "string" },
    { name: "teamName", type: "string" },
    { name: "huntId", type: "uint256" },
    { name: "clueIndex", type: "uint256" },
    { name: "teamLeaderAddress", type: "address" },
    { name: "solverAddress", type: "address" },
    { name: "timestamp", type: "uint256" },
    { name: "attemptCount", type: "uint256" },
  ],
};

let schemaId = process.env.SIGN_SCHEMA_ID;

/**
 * Create the schema for clue solving attestations
 * This should be called once during setup
 */
export async function createClueSchema() {
  try {
    console.log("Creating Sign Protocol schema for clue solving...");
    const schemaInfo = await client.createSchema(CLUE_SCHEMA);
    console.log("Schema created successfully:", schemaInfo);
    
    // Store schema ID for future use
    schemaId = schemaInfo.schemaId;
    console.log("Schema ID:", schemaId);
    
    return schemaInfo;
  } catch (error) {
    console.error("Failed to create schema:", error);
    throw error;
  }
}

/**
 * Create an attestation when a team solves a clue
 * @param {string} teamIdentifier - The team identifier (teamId for teams, wallet address for solo users)
 * @param {number} huntId - The hunt ID
 * @param {number} clueIndex - The clue index (1-based)
 * @param {string} teamLeaderAddress - The team leader's wallet address
 * @param {string} solverAddress - The address of the team member who solved the clue
 * @param {number} attemptCount - Number of attempts made for this clue
 * @returns {Promise<Object>} The attestation result
 */
export async function attestClueSolved(
  teamIdentifier,
  huntId,
  clueIndex,
  teamLeaderAddress,
  solverAddress,
  attemptCount,
  teamName
) {
  try {
    if (!schemaId) {
      throw new Error("Schema ID not found. Please create schema first.");
    }

    const timestamp = Math.floor(Date.now() / 1000); // Current timestamp in seconds
    const indexingValue = getIndexingValue(huntId);

    console.log("Creating attestation for clue solve:", {
      teamIdentifier,
      teamName,
      huntId,
      clueIndex,
      teamLeaderAddress,
      solverAddress,
      attemptCount,
      timestamp,
      indexingValue,
    });

    const attestationData = {
      teamIdentifier: teamIdentifier.toString(),
      teamName: (teamName || (teamIdentifier?.startsWith?.('0x') ? teamIdentifier : '')).toString(),
      huntId: huntId.toString(),
      clueIndex: clueIndex.toString(),
      teamLeaderAddress,
      solverAddress,
      timestamp: timestamp.toString(),
      attemptCount: attemptCount.toString(),
    };

    const attestationInfo = await client.createAttestation(
    // TODO: Pass the solver address in the recipients array
    {
      schemaId,
      data: attestationData,
      indexingValue,
    });

    console.log("Attestation created successfully:", attestationInfo);
    return attestationInfo;
  } catch (error) {
    console.error("Failed to create attestation:", error);
    throw error;
  }
}

/**
 * Query all attestations for a specific hunt
 * @param {number} huntId - The hunt ID to query
 * @returns {Promise<Array>} Array of attestations for the hunt
 */
export async function queryAttestationsForHunt(huntId) {
  try {
    console.log(`Querying attestations for hunt ${huntId}...`);

    // Query attestations using the schema ID and indexing value pattern    
    const result = await indexService.queryAttestationList({
      schemaId,
      page: 1,
      mode: 'offchain',
      // this is important as we should not respect any other attestations made even for the same schema by other users
      registrant: process.env.SIGN_WALLET_PUBLIC_ADDRESS,
      indexingValue: getIndexingValue(huntId)
    });

    if (!result) {
      console.warn(`No attestations found for hunt ${huntId}`);
      return [];
    }

    console.log(`Found ${result.rows.length} attestations for hunt ${huntId}`);
    return result.rows;
  } catch (error) {
    console.error("Failed to query attestations:", error);
    throw error;
  }
}

/**
 * Get schema ID (for external use)
 * @returns {string} The schema ID
 */
export function getSchemaId() {
  return schemaId;
}

/**
 * Set schema ID (for external use)
 * @param {string} id - The schema ID to set
 */
export function setSchemaId(id) {
  schemaId = id;
}

/**
 * Get the indexing value for an attestation
 * @param {number} huntId - The hunt ID
 * @returns {string} The indexing value
 */
function getIndexingValue(huntId) {
  return `khoj-hunt-${huntId}`;
}

