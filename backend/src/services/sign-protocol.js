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

// Schema definition for clue solving attestations (when a clue is successfully solved)
const CLUE_SCHEMA = {
  name: "Khoj Clue Solve",
  description: "Attestation for when a team solves a clue in a Khoj hunt",
  data: [
    { name: "teamIdentifier", type: "string" },
    { name: "huntId", type: "uint256" },
    { name: "clueIndex", type: "uint256" },
    { name: "teamLeaderAddress", type: "address" },
    { name: "solverAddress", type: "address" },
    { name: "timeTaken", type: "uint256" }, // Time taken to solve in seconds (changed from timestamp)
    { name: "attemptCount", type: "uint256" },
  ],
};

// Schema definition for tracking retry attempts
const CLUE_RETRY_SCHEMA = {
  name: "Khoj Clue Retry Schema",
  description: "Attestation for when a team attempts to solve a clue in a Khoj hunt",
  data: [
    { name: "teamIdentifier", type: "string" },
    { name: "huntId", type: "uint256" },
    { name: "clueIndex", type: "uint256" },
    { name: "solverAddress", type: "address" },
    { name: "timestamp", type: "uint256" },
    { name: "attemptCount", type: "uint256" },
  ],
};

let schemaId = process.env.SIGN_SCHEMA_ID;
let retrySchemaId = process.env.SIGN_RETRY_SCHEMA_ID;

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
 * Create the schema for clue retry attestations
 * This should be called once during setup
 */
export async function createClueRetrySchema() {
  try {
    console.log("Creating Sign Protocol schema for clue retries...");
    const schemaInfo = await client.createSchema(CLUE_RETRY_SCHEMA);
    console.log("Retry schema created successfully:", schemaInfo);
    
    // Store schema ID for future use
    retrySchemaId = schemaInfo.schemaId;
    console.log("Retry Schema ID:", retrySchemaId);
    
    return schemaInfo;
  } catch (error) {
    console.error("Failed to create retry schema:", error);
    throw error;
  }
}

/**
 * Create an attestation when a team attempts to solve a clue (for retry tracking)
 * @param {string} teamIdentifier - The team identifier (teamId for teams, wallet address for solo users)
 * @param {number} huntId - The hunt ID
 * @param {number} clueIndex - The clue index (1-based)
 * @param {string} solverAddress - The address of the team member who attempted the clue
 * @param {number} attemptCount - Current attempt count (1-based)
 * @returns {Promise<Object>} The attestation result
 */
export async function attestClueAttempt(
  teamIdentifier,
  huntId,
  clueIndex,
  solverAddress,
  attemptCount
) {
  try {
    if (!retrySchemaId) {
      throw new Error("Retry Schema ID not found. Please create retry schema first.");
    }

    const timestamp = Math.floor(Date.now() / 1000); // Current timestamp in seconds
    const indexingValue = getRetryIndexingValue(huntId, clueIndex, teamIdentifier);

    console.log("Creating attestation for clue attempt:", {
      teamIdentifier,
      huntId,
      clueIndex,
      solverAddress,
      attemptCount,
      timestamp,
      indexingValue,
    });

    const attestationData = {
      teamIdentifier: teamIdentifier.toString(),
      huntId: huntId.toString(),
      clueIndex: clueIndex.toString(),
      solverAddress,
      timestamp: timestamp.toString(),
      attemptCount: attemptCount.toString(),
    };

    const attestationInfo = await client.createAttestation({
      schemaId: retrySchemaId,
      data: attestationData,
      indexingValue,
    });

    console.log("Retry attestation created successfully:", attestationInfo);
    return attestationInfo;
  } catch (error) {
    console.error("Failed to create retry attestation:", error);
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
 * @param {number} timeTaken - Time taken to solve the clue in seconds
 * @param {number} attemptCount - Number of attempts made for this clue
 * @returns {Promise<Object>} The attestation result
 */
export async function attestClueSolved(
  teamIdentifier,
  huntId,
  clueIndex,
  teamLeaderAddress,
  solverAddress,
  timeTaken,
  attemptCount
) {
  try {
    if (!schemaId) {
      throw new Error("Schema ID not found. Please create schema first.");
    }

    const indexingValue = getIndexingValue(huntId);

    console.log("Creating attestation for clue solve:", {
      teamIdentifier,
      huntId,
      clueIndex,
      teamLeaderAddress,
      solverAddress,
      timeTaken,
      attemptCount,
      indexingValue,
    });

    const attestationData = {
      teamIdentifier: teamIdentifier.toString(),
      huntId: huntId.toString(),
      clueIndex: clueIndex.toString(),
      teamLeaderAddress,
      solverAddress,
      timeTaken: timeTaken.toString(),
      attemptCount: attemptCount.toString(),
    };

    const attestationInfo = await client.createAttestation({
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
 * Query retry attempts for a specific clue and team
 * @param {number} huntId - The hunt ID
 * @param {number} clueIndex - The clue index
 * @param {string} teamIdentifier - The team identifier
 * @returns {Promise<Array>} Array of retry attestations for the clue
 */
export async function queryRetryAttemptsForClue(huntId, clueIndex, teamIdentifier) {
  try {
    console.log(`Querying retry attempts for hunt ${huntId}, clue ${clueIndex}, team ${teamIdentifier}...`);

    if (!retrySchemaId) {
      console.warn("Retry schema ID not set, returning empty array");
      return [];
    }

    // Query retry attestations using the retry schema ID and specific indexing value
    const result = await indexService.queryAttestationList({
      schemaId: retrySchemaId,
      page: 1,
      mode: 'offchain',
      registrant: process.env.SIGN_WALLET_PUBLIC_ADDRESS,
      indexingValue: getRetryIndexingValue(huntId, clueIndex, teamIdentifier)
    });

    if (!result) {
      console.warn(`No retry attempts found for hunt ${huntId}, clue ${clueIndex}, team ${teamIdentifier}`);
      return [];
    }

    console.log(`Found ${result.rows.length} retry attempts`);
    return result.rows;
  } catch (error) {
    console.error("Failed to query retry attempts:", error);
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
 * Get retry schema ID (for external use)
 * @returns {string} The retry schema ID
 */
export function getRetrySchemaId() {
  return retrySchemaId;
}

/**
 * Set retry schema ID (for external use)
 * @param {string} id - The retry schema ID to set
 */
export function setRetrySchemaId(id) {
  retrySchemaId = id;
}

/**
 * Get the indexing value for a clue solve attestation
 * @param {number} huntId - The hunt ID
 * @returns {string} The indexing value
 */
function getIndexingValue(huntId) {
  return `khoj-hunt-${huntId}`;
}

/**
 * Get the indexing value for a retry attestation
 * @param {number} huntId - The hunt ID
 * @param {number} clueIndex - The clue index
 * @param {string} teamIdentifier - The team identifier
 * @returns {string} The indexing value
 */
function getRetryIndexingValue(huntId, clueIndex, teamIdentifier) {
  return `khoj-hunt-${huntId}-clue-${clueIndex}-team-${teamIdentifier}`;
}

