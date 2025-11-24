#!/usr/bin/env node

/**
 * Schema Creation Script for Sign Protocol
 * This script creates both schemas and outputs the schema IDs for .env
 */

import { createClueSchema, createClueRetrySchema } from '../src/services/sign-protocol.js';
import dotenv from 'dotenv';
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from the backend directory
dotenv.config({ path: resolve(__dirname, "../.env") });

async function createSchemas() {
  console.log('🔧 Creating Sign Protocol Schemas...\n');

  try {
    // Create clue solve schema
    if (process.env.SIGN_SCHEMA_ID) {
      console.log('⚠️  Clue Solve Schema ID already exists in environment:');
      console.log(`   SIGN_SCHEMA_ID=${process.env.SIGN_SCHEMA_ID}`);
    } else {
      console.log('Creating Clue Solve Schema...');
      const schemaInfo = await createClueSchema();
      console.log('✅ Clue Solve Schema created successfully!');
      console.log('\n📋 Add this to your .env file:');
      console.log(`SIGN_SCHEMA_ID=${schemaInfo.schemaId}`);
      console.log('\n🎯 Schema Details:');
      console.log(`   Name: ${schemaInfo.name}`);
      console.log(`   Description: ${schemaInfo.description}`);
      console.log(`   Schema ID: ${schemaInfo.schemaId}\n`);
    }

    // Create retry schema
    if (process.env.SIGN_RETRY_SCHEMA_ID) {
      console.log('⚠️  Retry Schema ID already exists in environment:');
      console.log(`   SIGN_RETRY_SCHEMA_ID=${process.env.SIGN_RETRY_SCHEMA_ID}`);
    } else {
      console.log('Creating Clue Retry Schema...');
      const retrySchemaInfo = await createClueRetrySchema();
      console.log('✅ Clue Retry Schema created successfully!');
      console.log('\n📋 Add this to your .env file:');
      console.log(`SIGN_RETRY_SCHEMA_ID=${retrySchemaInfo.schemaId}`);
      console.log('\n🎯 Retry Schema Details:');
      console.log(`   Name: ${retrySchemaInfo.name}`);
      console.log(`   Description: ${retrySchemaInfo.description}`);
      console.log(`   Schema ID: ${retrySchemaInfo.schemaId}\n`);
    }

    if (!process.env.SIGN_SCHEMA_ID || !process.env.SIGN_RETRY_SCHEMA_ID) {
      console.log('\n💡 Make sure to add both schema IDs to your .env file before running the application.');
    }
    
  } catch (error) {
    console.error('❌ Schema creation failed:', error.message);
    console.error('\n💡 Make sure you have set the following environment variables:');
    console.error('   - SIGN_WALLET_PRIVATE_KEY (funded wallet private key)');
    console.error('   - SIGN_API_KEY (from https://developer.sign.global/)');
    process.exit(1);
  }
}

// Run the schema creation
createSchemas();
