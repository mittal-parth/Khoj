# Khoj 🗺️ - Web3 Treasure Hunt Platform

![Khoj Banner](path/to/banner.png)

Khoj (meaning "search" or "discovery" in Hindi) is a gamified geo-location based treasure hunt platform that combines real-world exploration with Web3 technology. Built during ETHIndia Hackathon 2024, Khoj transforms traditional scavenger hunts into an immersive blockchain experience.

## 🌟 Overview

Khoj allows users to participate in location-based AI treasure hunts where they solve riddles, visit physical locations, and earn onchain rewards. Users receive unique NFTs upon registration, and the platform supports multiple blockchain networks for maximum accessibility.

## ✨ Key Features

### 🎮 Core Gameplay
- **Location-Based Verification**: Real-time GPS tracking to verify players' presence at clue locations
- **Progressive Riddles**: Each hunt consists of multiple interconnected clues that tell a story
- **Multiple Attempts**: Players get 3 attempts per clue to verify their location
- **Real-time Collaboration**: Built-in video chat for team coordination

### 💫 Web3 Integration
- **Multi-Chain Support**: Deployed across Base, Moonbeam Parachain, and BNB Chain
- **Smart Wallet Integration**: Seamless login via Coinbase Developer Platform SDK
- **NFT Registration**: Unique NFTs minted for each registered user
- **Decentralized Storage**: Rich media and hunt data stored on Walrus network
- **Trust Scoring**: Dynamic trust score & attestation system based on hunt completion metrics
- **Blockchain Attestations**: Every solved clue is attested on-chain via True Network
- **Smart Contract Integration**: Hunt registration and reward distribution handled on-chain
- **Token Rewards**: Earn Crypto Coins and special perks based on performance

### 🎨 User Experience
- **Sleek UI**: Modern, responsive interface with playful design elements
- **Real-time Progress**: Live tracking of hunt progress and trust score
- **Picture-in-Picture**: Continue video collaboration while solving clues
- **Reward Marketplace**: Redeem earned rewards for real-world perks

## 🛠️ Technology Stack

- **Frontend**: React, TypeScript, TailwindCSS
- **Web3**:
  - True Network SDK for attestations
  - Multi-chain deployment (Base, Moonbeam, BNB Chain)
  - Coinbase's CDP SDK for smart wallet authentication
  - Lit Protocol for secure location verification and blind compute
  - Walrus for decentralized storage
- **Storage & Media**: 
  - Walrus Network for NFT and hunt data
  - Distributed content delivery
- **Video**: Huddle01 for real-time collaboration
- **UI Components**: 
  - Radix UI primitives
  - Recharts for data visualization
  - Custom animated components

## 🤝 Sponsor Integrations

### True Network
- Trust attestations for hunt completions
- Verifiable location proofs
- Reputation scoring system

### Base
- L2 smart contract deployment
- Low-cost transactions
- Fast finality for real-time updates

### Huddle01
- Decentralized video collaboration
- Web3-native communication
- Secure team coordination

### Coinbase
- CDP SDK for smart wallet integration
- Seamless user onboarding
- Secure authentication
- OnchainKit for transactions
- Wallet integration

### Lit Protocol
- Distributed secret management
- Blind compute network capabilities
- Secure location verification
- Cross-chain composability
- Privacy-preserving computations

### Walrus
- Decentralized storage for NFT metadata
- Rich media content storage (images, videos, audio)
- Efficient erasure coding for data availability
- Sui-powered coordination layer
- Cost-effective content distribution

## 🚀 Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/khoj.git
```

2. Install dependencies:
```bash
cd khoj
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Add your API keys for:
# - True Network
# - Huddle01
# - Other services
```

4. Start the development server:
```bash
npm run dev
```

## 🎮 How It Works

![image](https://github.com/user-attachments/assets/0c12a3e4-c1a7-4d86-a794-b49116c2d99b)


1. **Register**: Create an account and receive your unique NFT using CDP SDK
2. **Browse Hunts**: Explore available treasure hunts stored on Walrus network
3. **Connect Wallet**: Use smart wallet login powered by CDP SDK
4. **Solve Riddles**: Each hunt presents a series of location-based riddles
5. **Verify Location**: Use Lit Protocol to securely verify your presence
6. **Collaborate**: Use Huddle01's video chat to work with other hunters
7. **Earn Trust**: Build your trust score through successful completions
8. **Claim Rewards**: Earn rewards on your preferred supported chain

## 🏆 Trust Score System

Your trust score (0-10) is calculated based on:
- Speed of hunt completion
- Accuracy of location verification
- Number of attempts used
- Collaboration with other players

Higher scores unlock:
- Better ETH rewards
- Exclusive hunts
- Merchant discounts
- Additional attempts for difficult clues

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built during ETHIndia Hackathon 2024
- True Network team for their attestation infrastructure
- Huddle01 team for their video collaboration platform
- Base for providing the L2 infrastructure
- Coinbase for OnchainKit

## 👥 Team

- [Team Member 1](https://github.com/member1) - Frontend & Design
- [Team Member 2](https://github.com/member2) - Smart Contracts
- [Team Member 3](https://github.com/member3) - Backend Integration
- [Team Member 4](https://github.com/member4) - Product & Documentation


Built with ❤️ by Team Khoj
