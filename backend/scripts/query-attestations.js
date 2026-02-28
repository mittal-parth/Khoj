import {
  SignProtocolClient,
  SpMode,
  OffChainSignType,
  EvmChains,
  IndexService,
} from '@ethsign/sp-sdk';
import { privateKeyToAccount } from 'viem/accounts';
import dotenv from 'dotenv';
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from the backend directory
dotenv.config({ path: resolve(__dirname, "../.env") });

const indexService = new IndexService('mainnet');
const client = new SignProtocolClient(SpMode.OffChain, {
  signType: OffChainSignType.EvmEip712,
  account: privateKeyToAccount(process.env.SIGN_WALLET_PRIVATE_KEY?.trim()),
  chain: EvmChains.optimismSepolia,
  apiKey: process.env.SIGN_API_KEY?.trim(),
});

// Test-only values - do not conflict with real attestations (chain 999999, hunt 999999, suffix fee)
const TEST_CHAIN_ID = '99999999';
const TEST_HUNT_ID = 99999999;
const TEST_CLUE_INDEX = 9991;
const TEST_INDEXING_VALUE = `khoj-${TEST_CHAIN_ID}-hunt-${TEST_HUNT_ID}-clue-${TEST_CLUE_INDEX}-team-test-recipients-fee`;

// --- Create basic test attestation with recipients ---
async function createBasicTestAttestationWithRecipients() {
  const recipientAddress = process.env.SIGN_WALLET_PUBLIC_ADDRESS;
  const recipientAddress1 = "0x7F23F30796F54a44a7A95d8f8c8Be1dB017C3397";
  if (!recipientAddress) {
    throw new Error('SIGN_WALLET_PUBLIC_ADDRESS not set');
  }

  const attestation = await client.createAttestation({
    schemaId: process.env.SIGN_RETRY_SCHEMA_ID,
    data: {
      teamIdentifier: 'test-recipients',
      teamName: 'Test Recipients',
      huntId: String(TEST_HUNT_ID),
      clueIndex: String(TEST_CLUE_INDEX),
      solverAddress: recipientAddress,
      attemptCount: String(TEST_CLUE_INDEX),
      chainId: TEST_CHAIN_ID,
    },
    indexingValue: TEST_INDEXING_VALUE,
    recipients: [recipientAddress, recipientAddress1],
  });

  console.log("Basic attestation with recipients created:", attestation);
  return attestation;
}

// Uncomment to create test attestation:
// await createBasicTestAttestationWithRecipients();

const attestations = await indexService.queryAttestationList({
schemaId: process.env.SIGN_SCHEMA_ID,
  page: 1,
  mode: 'offchain',
  registrant: process.env.SIGN_WALLET_PUBLIC_ADDRESS,
  indexingValue: TEST_INDEXING_VALUE
});

console.log("==== Attestations ====\n\n");
console.log(attestations);

const retryAttestations = await indexService.queryAttestationList({
  schemaId: process.env.SIGN_RETRY_SCHEMA_ID,
    page: 1,
    mode: 'offchain',
    registrant: process.env.SIGN_WALLET_PUBLIC_ADDRESS,
    indexingValue: TEST_INDEXING_VALUE
  });
  
console.log("==== Retry Attestations ====\n\n");
console.log(retryAttestations);

console.log("Schema ID:", process.env.SIGN_RETRY_SCHEMA_ID);

const res = await indexService.querySchema(process.env.SIGN_RETRY_SCHEMA_ID);
console.log(res);