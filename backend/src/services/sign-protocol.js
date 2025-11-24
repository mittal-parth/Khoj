import {
  SignProtocolClient,
  SpMode,
  OffChainSignType,
  EvmChains,
  IndexService,
} from "@ethsign/sp-sdk";
import { privateKeyToAccount } from "viem/accounts";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from the backend directory
dotenv.config({ path: resolve(__dirname, "../../.env") });

// Validate required environment variables (trim to handle whitespace)
const privateKey = process.env.SIGN_WALLET_PRIVATE_KEY?.trim();
const apiKey = process.env.SIGN_API_KEY?.trim();

if (!privateKey) {
  throw new Error(
    'SIGN_WALLET_PRIVATE_KEY is not set in environment variables. ' +
    'Please create a .env file in the backend directory with SIGN_WALLET_PRIVATE_KEY and SIGN_API_KEY. ' +
    'You can generate a wallet using: node scripts/create-wallet.js'
  );
}

if (!apiKey) {
  throw new Error(
    'SIGN_API_KEY is not set in environment variables. ' +
    'Please create a .env file in the backend directory with SIGN_API_KEY. ' +
    'Get your API key from: https://developer.sign.global/'
  );
}

// Initialize Sign Protocol client in hybrid mode
const client = new SignProtocolClient(SpMode.OffChain, {
  signType: OffChainSignType.EvmEip712,
  account: privateKeyToAccount(privateKey),
  chain: EvmChains.optimismSepolia,
  apiKey: apiKey,
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
    { name: "timeTaken", type: "uint256" }, // Time taken to solve in seconds
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
 * Also used for hunt start tracking with clueIndex: 0, attemptCount: 0
 * @param {string} teamIdentifier - The team identifier (teamId for teams, wallet address for solo users)
 * @param {number} huntId - The hunt ID
 * @param {number} clueIndex - The clue index (1-based, or 0 for hunt start)
 * @param {string} solverAddress - The address of the team member who attempted the clue
 * @param {number} attemptCount - Current attempt count (1-based, or 0 for hunt start)
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

    const indexingValue = getRetryIndexingValue(huntId, clueIndex, teamIdentifier);

    const logMessage = clueIndex === 0 
      ? "Creating attestation for hunt start:" 
      : "Creating attestation for clue attempt:";
    
    console.log(logMessage, {
      teamIdentifier,
      huntId,
      clueIndex,
      solverAddress,
      attemptCount,
      indexingValue,
    });

    const attestationData = {
      teamIdentifier: teamIdentifier.toString(),
      huntId: huntId.toString(),
      clueIndex: clueIndex.toString(),
      solverAddress,
      attemptCount: attemptCount.toString(),
    };

    const attestationInfo = await client.createAttestation({
      schemaId: retrySchemaId,
      data: attestationData,
      indexingValue,
    });

    const successMessage = clueIndex === 0
      ? "Hunt start attestation created successfully:"
      : "Retry attestation created successfully:";
    console.log(successMessage, attestationInfo);
    return attestationInfo;
  } catch (error) {
    console.error("Failed to create attestation:", error);
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
 * Also used to query hunt start (clueIndex: 0)
 * @param {number} huntId - The hunt ID
 * @param {number} clueIndex - The clue index (or 0 for hunt start)
 * @param {string} teamIdentifier - The team identifier
 * @returns {Promise<Array>} Array of retry attestations for the clue
 */
export async function queryRetryAttemptsForClue(huntId, clueIndex, teamIdentifier) {
  try {
    const logMessage = clueIndex === 0
      ? `Querying hunt start for hunt ${huntId}, team ${teamIdentifier}...`
      : `Querying retry attempts for hunt ${huntId}, clue ${clueIndex}, team ${teamIdentifier}...`;
    console.log(logMessage);

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
      const warnMessage = clueIndex === 0
        ? `No hunt start found for hunt ${huntId}, team ${teamIdentifier}`
        : `No retry attempts found for hunt ${huntId}, clue ${clueIndex}, team ${teamIdentifier}`;
      console.warn(warnMessage);
      return [];
    }

    const successMessage = clueIndex === 0
      ? `Found hunt start attestation`
      : `Found ${result.rows.length} retry attempts`;
    console.log(successMessage);
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

