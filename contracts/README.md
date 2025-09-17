# Khoj Contracts

## Overview

This is the repository for the Khoj contracts.

Directory structure:

- `src/`: Contains the Khoj contracts.
- `test/`: Contains the test suite.
- `scripts/`: Contains miscellaneous scripts.

Always deploy the KhojNFT contract first, then the Khoj contract.

## Testing

This comprehensive test suite covers all functionality of the Khoj.sol smart contract with extensive positive and negative test cases.

### Setup

1. Install dependencies:
```bash
npm install
```

2. Compile contracts:
```bash
npx hardhat compile
```

3. Run tests:
```bash
npx hardhat test
```

### Running Specific Test Suites

To run specific test categories:

```bash
# Run only hunt creation tests
npx hardhat test --grep "Hunt Creation"

# Run only team creation tests
npx hardhat test --grep "Team Creation"

# Run only team joining tests
npx hardhat test --grep "Team Joining"

# Run only view function tests
npx hardhat test --grep "View Functions"
```
