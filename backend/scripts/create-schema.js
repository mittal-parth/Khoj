#!/usr/bin/env node

/**
 * Schema Creation Script for Sign Protocol
 * This script creates the schema once and outputs the schema ID for .env
 */

import { createClueSchema } from '../src/services/sign-protocol.js';
import dotenv from 'dotenv';

dotenv.config();

async function createSchema() {
  console.log('🔧 Creating Sign Protocol Schema...\n');

  try {
    // Check if schema ID already exists
    if (process.env.SIGN_SCHEMA_ID) {
      console.log('⚠️  Schema ID already exists in environment:');
      console.log(`   SIGN_SCHEMA_ID=${process.env.SIGN_SCHEMA_ID}`);
      console.log('\n💡 If you want to create a new schema, remove SIGN_SCHEMA_ID from your .env file first.');
      return;
    }

    // Create the schema
    const schemaInfo = await createClueSchema();
    
    console.log('✅ Schema created successfully!');
    console.log('\n📋 Add this to your .env file:');
    console.log(`SIGN_SCHEMA_ID=${schemaInfo.schemaId}`);
    console.log('\n🎯 Schema Details:');
    console.log(`   Name: ${schemaInfo.name}`);
    console.log(`   Description: ${schemaInfo.description}`);
    console.log(`   Schema ID: ${schemaInfo.schemaId}`);
    
  } catch (error) {
    console.error('❌ Schema creation failed:', error.message);
    console.error('\n💡 Make sure you have set the following environment variables:');
    console.error('   - SIGN_WALLET_PRIVATE_KEY (funded wallet private key)');
    console.error('   - SIGN_API_KEY (from https://developer.sign.global/)');
    process.exit(1);
  }
}

// Run the schema creation
createSchema();
