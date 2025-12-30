/**
 * Test suite for Sign Protocol integration
 * Tests the actual function logic in sign-protocol.js
 * Note: Schema must be created first using create-schema.js
 */

import { attestClueSolved, queryAttestationsForHunt, getSchemaId } from '../src/services/sign-protocol.js';
import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = [
  'SIGN_SCHEMA_ID',
  'SIGN_WALLET_PRIVATE_KEY',
  'SIGN_API_KEY',
  'SIGN_WALLET_PUBLIC_ADDRESS',
];

const hasRequiredEnv = requiredEnvVars.every(
  (key) => typeof process.env[key] === 'string' && process.env[key].trim().length > 0
);

(hasRequiredEnv ? describe : describe.skip)('Sign Protocol Integration', () => {
  let createdAttestations = [];
  let attestationData = [];

  beforeAll(() => {
    attestationData = [
        {
            teamIdentifier: "1",
            huntId: 0,
            clueIndex: 1,
            teamLeaderAddress: '0x996090Fa3503cDB3e05E9bD78d3f00D3af867123',
            solverAddress: '0x996090Fa3503cDB3e05E9bD78d3f00D3af867123',
            timeTaken: 300,
            attemptCount: 2
        },
        {
            teamIdentifier: "2",
            huntId: 0,
            clueIndex: 2,
            teamLeaderAddress: '0x7F23F30796F54a44a7A95d8f8c8Be1dB017C3397',
            solverAddress: '0x9F45F50996F66c66c9C97e0e0e0Be3dB019E5519',
            timeTaken: 180,
            attemptCount: 1
        },
        {
            teamIdentifier: "0xAF56F60A96F77d77dAD08f1f1f1Be4dB020F6620",
            huntId: 0,
            clueIndex: 1,
            teamLeaderAddress: '0xAF56F60A96F77d77dAD08f1f1f1Be4dB020F6620',
            solverAddress: '0xAF56F60A96F77d77dAD08f1f1f1Be4dB020F6620',
            timeTaken: 450,
            attemptCount: 3
        }
    ]
  });

  describe('Attestation Creation', () => {
    test('should create attestation for team 1', async () => {
      const testData = attestationData[0];

      const result = await attestClueSolved(
        testData.teamIdentifier,
        testData.huntId,
        testData.clueIndex,
        testData.teamLeaderAddress,
        testData.solverAddress,
        testData.timeTaken,
        testData.attemptCount
      );

      expect(result).toBeDefined();
      expect(result.attestationId).toBeDefined();
      
      createdAttestations.push(result);
    });

    test('should create attestation for team 2', async () => {
      const testData = attestationData[1];

      const result = await attestClueSolved(
        testData.teamIdentifier,
        testData.huntId,
        testData.clueIndex,
        testData.teamLeaderAddress,
        testData.solverAddress,
        testData.timeTaken,
        testData.attemptCount
      );

      expect(result).toBeDefined();
      expect(result.attestationId).toBeDefined();
      expect(result.attestationId).not.toBe(createdAttestations[0].attestationId);
      
      createdAttestations.push(result);
    });

    test('should create attestation for solo user', async () => {
      const testData = attestationData[2];

      const result = await attestClueSolved(
        testData.teamIdentifier,
        testData.huntId,
        testData.clueIndex,
        testData.teamLeaderAddress,
        testData.solverAddress,
        testData.timeTaken,
        testData.attemptCount
      );

      expect(result).toBeDefined();
      expect(result.attestationId).toBeDefined();
      expect(result.attestationId).not.toBe(createdAttestations[0].attestationId);
      expect(result.attestationId).not.toBe(createdAttestations[1].attestationId);
      
      createdAttestations.push(result);
    });
  });

  describe('Attestation Querying', () => {
    test('should query attestations for hunt 0 and return array', async () => {
      const result = await queryAttestationsForHunt(0);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(3);
    });

    test('should return attestations with correct data', async () => {
      const result = await queryAttestationsForHunt(0);
      
      expect(result.length).toBeGreaterThan(0);

      // extract the id from each object in result array 
      const attestationIds = result.map(attestation => attestation.id);
      expect(attestationIds.length).toBeGreaterThan(0);

      // attestationIds should contain the attestationIds from the createdAttestations array
      expect(attestationIds).toContain(createdAttestations[0].attestationId);
      expect(attestationIds).toContain(createdAttestations[1].attestationId);
      expect(attestationIds).toContain(createdAttestations[2].attestationId);   

      // Each attestation should have the correct data as per attestationData array
      for (let i = 0; i < attestationData.length; i++) {
        let attestationDatum = attestationData[i];
        let attestationResult = result.find(attestationResult => attestationResult.id === createdAttestations[i].attestationId);
        expect(attestationResult).toBeDefined();
        expect(attestationResult.data).toBeDefined();
        expect(typeof attestationResult.data).toBe('string');
        expect(attestationResult.indexingValue).toBe(`khoj-hunt-${attestationDatum.huntId}`);

        let attestationResultBody = JSON.parse(attestationResult.data);
        expect(attestationResultBody.teamIdentifier).toBe(attestationDatum.teamIdentifier);
        expect(attestationResultBody.huntId).toBe(attestationDatum.huntId.toString());
        expect(attestationResultBody.clueIndex).toBe(attestationDatum.clueIndex.toString());
        expect(attestationResultBody.teamLeaderAddress).toBe(attestationDatum.teamLeaderAddress);
        expect(attestationResultBody.solverAddress).toBe(attestationDatum.solverAddress);
        expect(attestationResultBody.attemptCount).toBe(attestationDatum.attemptCount.toString());
        expect(attestationResultBody.timeTaken).toBe(attestationDatum.timeTaken.toString());
        expect(attestationResultBody.timeTaken).toBeDefined();
      }
    });
  });

  describe('Schema Management', () => {
    test('should get schema ID', () => {
      const schemaId = getSchemaId();
      expect(schemaId).toBe(process.env.SIGN_SCHEMA_ID);
    });
  });
});
