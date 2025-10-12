import { IndexService } from '@ethsign/sp-sdk';
import dotenv from 'dotenv';

dotenv.config();

const indexService = new IndexService('mainnet');

const attestations = await indexService.queryAttestationList({
schemaId: process.env.SIGN_SCHEMA_ID,
  page: 1,
  mode: 'offchain',
  registrant: process.env.SIGN_WALLET_PUBLIC_ADDRESS,
  indexingValue: `khoj-0-0`
});

console.log(attestations);

for (const attestation of attestations.rows) {
  const data = JSON.parse(attestation.data);
  console.log(data);
  console.log(data.teamIdentifier);
  console.log(data.huntId);
  console.log(data.clueIndex);
  console.log(data.teamLeaderAddress);
  console.log(data.solverAddress);
  console.log(data.timestamp);
  console.log(data.attemptCount);
}

// // SPA_CpMJg4P3KmYO66evgrASn

console.log("Schema ID:", process.env.SIGN_SCHEMA_ID);

const res = await indexService.querySchema(process.env.SIGN_SCHEMA_ID);
console.log(res);