import { IndexService } from '@ethsign/sp-sdk';
import dotenv from 'dotenv';
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from the backend directory
dotenv.config({ path: resolve(__dirname, "../.env") });

const indexService = new IndexService('mainnet');

const attestations = await indexService.queryAttestationList({
schemaId: process.env.SIGN_SCHEMA_ID,
  page: 1,
  mode: 'offchain',
  registrant: process.env.SIGN_WALLET_PUBLIC_ADDRESS,
  indexingValue: `khoj-hunt-29`
});

console.log("==== Attestations ====\n\n");
console.log(attestations);

const retryAttestations = await indexService.queryAttestationList({
  schemaId: process.env.SIGN_RETRY_SCHEMA_ID,
    page: 1,
    mode: 'offchain',
    registrant: process.env.SIGN_WALLET_PUBLIC_ADDRESS,
    indexingValue: `khoj-hunt-29-clue-3-team-23`
  });
  
console.log("==== Retry Attestations ====\n\n");
console.log(retryAttestations);

console.log("Schema ID:", process.env.SIGN_RETRY_SCHEMA_ID);

const res = await indexService.querySchema(process.env.SIGN_RETRY_SCHEMA_ID);
console.log(res);