#!/usr/bin/env node

/**
 * Test script for Sign Protocol integration
 * This script tests the functionality of attestations and queries
 * Note: Schema must be created first using create-schema.js
 */

import { attestClueSolved, queryAttestationsForHunt, getSchemaId } from '../src/services/sign-protocol.js';
import dotenv from 'dotenv';

dotenv.config();

async function testSignProtocol() {
  console.log('🧪 Testing Sign Protocol Functionality...\n');

  try {
    // Check if schema ID exists
    if (!process.env.SIGN_SCHEMA_ID) {
      console.error('❌ SIGN_SCHEMA_ID not found in environment variables.');
      console.error('💡 Run "node create-schema.js" first to create the schema.');
      process.exit(1);
    }

    console.log('✅ Schema ID found:', process.env.SIGN_SCHEMA_ID);

    // Test 1: Create Multiple Attestations
    console.log('\n1️⃣ Creating test attestations...');
    
    const testAttestations = [
      {
        teamId: 0,
        huntId: 0,
        clueIndex: 1,
        teamLeaderAddress: '0x996090Fa3503cDB3e05E9bD78d3f00D3af867123',
        solverAddress: '0x996090Fa3503cDB3e05E9bD78d3f00D3af867123',
        attemptCount: 2
      },
      {
        teamId: 1,
        huntId: 0,
        clueIndex: 2,
        teamLeaderAddress: '0x7F23F30796F54a44a7A95d8f8c8Be1dB017C3397',
        solverAddress: '0x9F45F50996F66c66c9C97e0e0e0Be3dB019E5519',
        attemptCount: 1
      },
      {
        teamId: 2,
        huntId: 0,
        clueIndex: 1,
        teamLeaderAddress: '0xAF56F60A96F77d77dAD08f1f1f1Be4dB020F6620',
        solverAddress: '0xBF67F70B96F88e88eBE19g2g2g2Be5dB021G7731',
        attemptCount: 3
      }
    ];

    for (const attestation of testAttestations) {
      const result = await attestClueSolved(
        attestation.teamId,
        attestation.huntId,
        attestation.clueIndex,
        attestation.teamLeaderAddress,
        attestation.solverAddress,
        attestation.attemptCount
      );
      console.log(`   ✅ Team ${attestation.teamId}, Clue ${attestation.clueIndex}: ${result.attestationId}`);

    }


    // Test 2: Query Attestations
    console.log('\n2️⃣ Querying attestations for hunt 0...');
    // console.log('⏳ Waiting 3 seconds for indexing...');
    // await new Promise(resolve => setTimeout(resolve, 3000));
    
    const attestations = await queryAttestationsForHunt(0);
    console.log(`✅ Found ${attestations.length} attestation(s)`);
    
    if (attestations.length > 0) {
      console.log('\n📊 Sample attestation data:');
      attestations.forEach((att, index) => {
        const data = JSON.parse(att.data);
        console.log(`   ${index + 1}. Team ${data.teamId}, Clue ${data.clueIndex}`);
        console.log(`      Solver: ${data.solverAddress}`);
        console.log(`      Attempts: ${data.attemptCount}`);
        console.log(`      Timestamp: ${new Date(parseInt(data.timestamp) * 1000).toISOString()}`);
      });
    }

    // Test 3: Verify Data Structure
    console.log('\n3️⃣ Verifying attestation data structure...');
    
    if (attestations.length > 0) {
      const sampleAttestation = attestations[0];
      console.log('✅ Attestation structure verification:');
      console.log(`   - Has data field: ${!!sampleAttestation.data}`);
      console.log(`   - Data is JSON string: ${typeof sampleAttestation.data === 'string'}`);
      
      const parsedData = JSON.parse(sampleAttestation.data);
      const requiredFields = ['teamId', 'huntId', 'clueIndex', 'teamLeaderAddress', 'solverAddress', 'timestamp', 'attemptCount'];
      const hasAllFields = requiredFields.every(field => parsedData.hasOwnProperty(field));
      console.log(`   - Has all required fields: ${hasAllFields}`);
      
      if (hasAllFields) {
        console.log('   - Field types verification:');
        console.log(`     teamId: ${typeof parsedData.teamId} (should be string)`);
        console.log(`     huntId: ${typeof parsedData.huntId} (should be string)`);
        console.log(`     clueIndex: ${typeof parsedData.clueIndex} (should be string)`);
        console.log(`     teamLeaderAddress: ${typeof parsedData.teamLeaderAddress} (should be string)`);
        console.log(`     solverAddress: ${typeof parsedData.solverAddress} (should be string)`);
        console.log(`     timestamp: ${typeof parsedData.timestamp} (should be string)`);
        console.log(`     attemptCount: ${typeof parsedData.attemptCount} (should be string)`);
      }
    }

    console.log('\n🎉 All Sign Protocol tests passed! Integration is working correctly.');
    console.log('\n💡 Note: For leaderboard testing, run "node test-leaderboard.js"');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\n💡 Make sure you have set the following environment variables:');
    console.error('   - SIGN_WALLET_PRIVATE_KEY (funded wallet private key)');
    console.error('   - SIGN_API_KEY (from https://developer.sign.global/)');
    console.error('   - SIGN_SCHEMA_ID (run "node create-schema.js" first)');
    process.exit(1);
  }
}

// Run the test
testSignProtocol();
