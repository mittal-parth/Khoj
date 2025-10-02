# Khoj Frontend

A React-based frontend for the Khoj treasure hunt application.

## Environment Setup

To run this application, you need to configure the following environment variables:

### Required Environment Variables

Create a `.env` file in the frontend directory with the following variables:

```bash
# Contract addresses for different networks
VITE_PUBLIC_MOONBASE_ALPHA_CONTRACT_ADDRESS=0x...
VITE_PUBLIC_BASE_CONTRACT_ADDRESS=0x...
VITE_PUBLIC_ASSET_HUB_CONTRACT_ADDRESS=0x...

# Backend URL (if applicable)
VITE_PUBLIC_BACKEND_URL=http://localhost:3000

# Hunt filtering feature flag
VITE_ENABLE_HUNT_FILTERING=false
```

### Contract Address Configuration

The application supports multiple networks:
- **Moonbase Alpha**: Set `VITE_PUBLIC_MOONBASE_ALPHA_CONTRACT_ADDRESS`
- **Base Sepolia**: Set `VITE_PUBLIC_BASE_CONTRACT_ADDRESS`  
- **Asset Hub**: Set `VITE_PUBLIC_ASSET_HUB_CONTRACT_ADDRESS`

If a contract address is not configured for the selected network, the application will display a helpful error message instead of crashing.

## Error Handling

The application includes comprehensive error handling:

- **Error Boundary**: Catches JavaScript errors and displays user-friendly error pages
- **Contract Validation**: Validates contract addresses before making calls
- **ABI Decoding Errors**: Handles cases where contracts are not deployed or accessible
- **Network Issues**: Provides clear feedback for connection problems

## Development

```bash
npm install
npm run dev
```

## Building

```bash
npm run build
```
