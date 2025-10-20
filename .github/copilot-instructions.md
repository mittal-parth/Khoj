# Khoj - Web3 Treasure Hunt Platform

Always follow these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

Khoj is a Web3 treasure hunt platform with three main components: React/TypeScript frontend, Express.js backend with Web3 integrations, and Hardhat smart contracts. The platform uses Sign Protocol attestations, Lit Protocol for location verification, Huddle01 for video collaboration, and multiple blockchain networks.

## Working Effectively

### Initial Setup Commands
Run these commands in exact order for a fresh environment:

```bash
# Install dependencies for all components - NEVER CANCEL these operations
cd frontend && npm install  # Takes ~90 seconds
cd ../backend && npm install  # Takes ~25 seconds  
cd ../contracts && npm install  # Takes ~15 seconds
```

**CRITICAL TIMING**: Set timeout to 180+ seconds for dependency installations. Frontend npm install takes up to 90 seconds with dependency resolution warnings - this is NORMAL.

### Environment Setup
Before running any application:

1. **Backend environment**:
   ```bash
   cd backend && cp .env.example .env
   ```
   Required variables: `HUDDLE_PROJECT_ID`, `HUDDLE_API_KEY`, `LIT_WALLET_PRIVATE_KEY`, `PINATA_JWT`, `PINATA_GATEWAY`, `HOST`, `PORT`, `MAX_DISTANCE_IN_METERS`

2. **Frontend environment**:
   ```bash
   cd frontend && cp .env.example .env  
   ```
   Required variables: `VITE_PUBLIC_THIRDWEB_CLIENT_ID`, `VITE_PUBLIC_HUDDLE_PROJECT_ID`, `VITE_PUBLIC_HUDDLE_API_KEY`, contract addresses for Base/Moonbase/Asset Hub, `VITE_PUBLIC_BACKEND_URL`, `VITE_PUBLIC_GEMINI_API_KEY`

### Build and Test Commands

1. **Frontend build and preview**:
   ```bash
   cd frontend
   npm run build  # Takes ~35 seconds - NEVER CANCEL, set timeout to 60+ seconds
   npm run preview  # Starts on http://localhost:4173
   npm run dev     # Development server on http://localhost:5173
   ```

2. **Backend server**:
   ```bash
   cd backend  
   npm start  # Requires valid environment variables and network connectivity
   ```
   **Note**: Backend requires network access to Lit Protocol and external Web3 services. Will fail with connection errors if environment variables are empty or invalid.

3. **Smart contracts**:
   ```bash
   cd contracts
   npm run compile  # Requires network access to download Solidity compiler
   npm run test     # Runs comprehensive test suite
   ```
   **Note**: Contract compilation and testing require network access to `binaries.soliditylang.org` for Solidity compiler downloads. May fail in restricted network environments.

### Linting and Code Quality
```bash
cd frontend && npm run lint  # Reports TypeScript and React issues
```
**Known Issues**: ESLint reports conditional React Hook usage in `HuntDetails.tsx` and prefer-const issues in `Clue.tsx`. These need fixing before production.

## Validation Scenarios

### Manual Testing Requirements
After making changes, ALWAYS test these scenarios:

1. **Frontend Build Validation**:
   - Run `npm run build` - should complete in ~35 seconds
   - Check `dist/` directory is created with assets
   - Start preview server and verify page loads (may show blank due to missing Web3 config)

2. **Backend API Validation**:
   - Server should start without crashes when environment is configured
   - Check endpoints respond (requires valid API keys for full functionality)

3. **Contract Validation** (network connectivity required):
   - Compilation should succeed with Solidity 0.8.19
   - Test suite has comprehensive coverage for hunt creation, team management

### Build Times and Timeouts
- **Frontend npm install**: 90 seconds - Set timeout to 180+ seconds
- **Frontend build**: 35 seconds - Set timeout to 60+ seconds  
- **Backend npm install**: 25 seconds - Set timeout to 60+ seconds
- **Contract npm install**: 15 seconds - Set timeout to 60+ seconds

**NEVER CANCEL** any build or install operation. Dependency resolution warnings are normal and expected.

## Application Architecture

### Frontend (`/frontend`)
- **Framework**: React 18 with TypeScript, Vite build system
- **Web3**: Thirdweb SDK v5, Wagmi, Viem for blockchain interactions
- **UI**: TailwindCSS, Radix UI primitives, Framer Motion animations
- **Key dependencies**: Huddle01 React, Leaflet maps, React Router

### Backend (`/backend`)
- **Framework**: Express.js with ES modules
- **Web3 Services**: Lit Protocol client, Huddle01 server SDK, Pinata IPFS
- **Key files**: `server.js` (main server), `huddle.js` (video), `pinata.js` (storage)
- **APIs**: Location verification, file uploads, video room management

### Smart Contracts (`/contracts`)
- **Framework**: Hardhat with OpenZeppelin contracts  
- **Contracts**: `Khoj.sol` (main hunt contract), `KhojNFT.sol` (NFT rewards)
- **Testing**: Comprehensive test suite in `/test/Khoj.test.js`
- **Deployment**: Multi-chain support (Base, Moonbeam, BNB Chain)

## Common Issues and Solutions

1. **Frontend build warnings about chunk sizes**: Normal for Web3 applications with large dependencies
2. **Backend crashes on startup**: Check all environment variables are set correctly
3. **Contract compilation fails**: Requires network access to download Solidity compiler
4. **Blank frontend page**: Requires proper Web3 environment configuration

## Development Workflow

1. **Always run setup commands in order** - dependencies must be installed before building
2. **Environment first** - Copy .env.example files before starting servers  
3. **Build validation** - Run builds to catch TypeScript/compilation errors early
4. **Lint before committing** - Address React Hook and TypeScript issues
5. **Test network connectivity** - Many components require external Web3 services

## Project Structure Quick Reference

```
/frontend/          - React/TypeScript Web3 frontend
  /src/components/ - React components (Clue.tsx, HuntDetails.tsx key files)
  package.json     - Frontend dependencies and scripts
/backend/          - Express.js Web3 backend
  server.js        - Main server with Lit Protocol integration
  package.json     - Backend dependencies  
/contracts/        - Hardhat smart contracts
  /src/            - Solidity contracts (Khoj.sol, KhojNFT.sol)
  /test/           - Contract test suite
  package.json     - Contract build and test scripts
```

Key configuration files: hardhat.config.js, vite.config.ts, tailwind.config.js