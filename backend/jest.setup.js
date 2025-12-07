// backend/jest.setup.js
// Only mock sign-protocol when CI_SKIP_SIGN_PROTOCOL is truthy (CI-only)
if (process.env.CI_SKIP_SIGN_PROTOCOL === 'true') {
  console.log('🔧 CI mode: Mocking sign-protocol and external services');
  
  // Set dummy environment variables to prevent sign-protocol.js from throwing errors on import
  // The actual Sign Protocol client will be initialized but won't be used in tests
  process.env.SIGN_WALLET_PRIVATE_KEY = process.env.SIGN_WALLET_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000001';
  process.env.SIGN_API_KEY = process.env.SIGN_API_KEY || 'mock-api-key';
  process.env.SIGN_SCHEMA_ID = process.env.SIGN_SCHEMA_ID || 'mock-schema-id';
  process.env.SIGN_RETRY_SCHEMA_ID = process.env.SIGN_RETRY_SCHEMA_ID || 'mock-retry-schema-id';
  process.env.SIGN_WALLET_PUBLIC_ADDRESS = process.env.SIGN_WALLET_PUBLIC_ADDRESS || '0x0000000000000000000000000000000000000000';
  
  // Set dummy Lit Protocol environment variable (64-char hex string as required by ethers.js)
  process.env.LIT_WALLET_PRIVATE_KEY = process.env.LIT_WALLET_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
}
