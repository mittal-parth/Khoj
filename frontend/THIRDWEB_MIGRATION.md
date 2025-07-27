# Migration from OnchainKit to thirdweb

This document outlines the changes made to replace OnchainKit with thirdweb in the ETHunt application.

## Changes Made

### 1. Package Dependencies
- **Removed**: `@coinbase/onchainkit`, `@rainbow-me/rainbowkit`
- **Added**: `thirdweb`

### 2. Configuration Files

#### New Files Created:
- `src/lib/client.ts` - thirdweb client configuration
- `src/lib/chains.ts` - Chain definitions for thirdweb
- `src/components/TransactionButton.tsx` - Custom transaction component
- `src/components/ThirdwebExample.tsx` - Example component demonstrating thirdweb usage

#### Modified Files:
- `src/providers.tsx` - Replaced OnchainKitProvider with ThirdwebProvider
- `src/helpers/WalletWrapper.tsx` - Replaced OnchainKit wallet components with thirdweb ConnectButton
- `src/components/Hunts.tsx` - Replaced Transaction components with custom TransactionButton
- `src/lib/wagmi.ts` - Simplified wagmi configuration (removed RainbowKit)
- `src/App.tsx` - Removed OnchainKit styles import, added thirdweb example route
- `.env.example` - Replaced OnchainKit API key with thirdweb client ID

### 3. Key Differences

#### Wallet Connection
**Before (OnchainKit):**
```tsx
import { ConnectWallet, Wallet, WalletDropdown } from '@coinbase/onchainkit/wallet';

<Wallet>
  <ConnectWallet text="Connect Wallet" />
  <WalletDropdown>
    {/* Dropdown content */}
  </WalletDropdown>
</Wallet>
```

**After (thirdweb):**
```tsx
import { ConnectButton } from "thirdweb/react";

<ConnectButton
  client={client}
  chains={[paseoAssetHub]}
  connectButton={{ label: "Connect Wallet" }}
  appMetadata={{
    name: "ETHunt",
    url: "https://ethunt.vercel.app",
  }}
/>
```

#### Transactions
**Before (OnchainKit):**
```tsx
import { Transaction, TransactionButton } from "@coinbase/onchainkit/transaction";

<Transaction
  calls={[{
    address: contractAddress,
    abi: abi,
    functionName: "functionName",
    args: [arg1, arg2]
  }]}
  onSuccess={handleSuccess}
>
  <TransactionButton text="Execute" />
</Transaction>
```

**After (thirdweb):**
```tsx
import { TransactionButton } from "./TransactionButton";

<TransactionButton
  contractAddress={contractAddress}
  abi={abi}
  functionName="functionName"
  args={[arg1, arg2]}
  text="Execute"
  onSuccess={handleSuccess}
/>
```

#### Account Management
**Before (OnchainKit):**
```tsx
import { useAccount } from 'wagmi';
const { address } = useAccount();
```

**After (thirdweb):**
```tsx
import { useActiveAccount } from "thirdweb/react";
const account = useActiveAccount();
const address = account?.address;
```

### 4. Environment Variables

Update your `.env` file:
```env
# Remove this
VITE_PUBLIC_ONCHAINKIT_API_KEY=

# Add this
VITE_PUBLIC_THIRDWEB_CLIENT_ID=your-thirdweb-client-id-here
```

### 5. Setup Instructions

1. Get your thirdweb client ID from [thirdweb dashboard](https://thirdweb.com/dashboard)
2. Add it to your `.env` file as `VITE_PUBLIC_THIRDWEB_CLIENT_ID`
3. Install dependencies: `npm install thirdweb`
4. Remove old dependencies: `npm uninstall @coinbase/onchainkit @rainbow-me/rainbowkit`

### 6. Testing

Visit `/thirdweb-example` route to see a working example of:
- Wallet connection
- Account display
- Transaction execution
- Chain information

### 7. Benefits of thirdweb

- **Unified SDK**: Single package for all Web3 functionality
- **Better TypeScript support**: Improved type safety
- **More wallet options**: Support for more wallet providers
- **Simplified API**: Cleaner, more intuitive API design
- **Better documentation**: Comprehensive guides and examples

### 8. Migration Checklist

- [x] Replace package dependencies
- [x] Update wallet connection components
- [x] Replace transaction components
- [x] Update providers configuration
- [x] Update environment variables
- [x] Create example component
- [x] Test wallet connection
- [x] Test transaction execution

The migration is now complete and the application should work with thirdweb instead of OnchainKit. 