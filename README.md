<div align="center">
<img src="https://github.com/user-attachments/assets/16b2a600-afb0-41b1-86cc-698bfcd2d333" alt="Khoj Logo" border="1" width="400"/>
<h1 align="center">Khoj</h1>
</div>

Khoj (meaning "search" or "discovery" in Hindi) is a geo-location based treasure hunt platform that combines real-world exploration with Web3 technology. Users can participate in location-based treasure hunts where they solve riddles, visit physical locations, and earn onchain rewards. Discover a new way to onboard users to Web3 with a Web2-native experience.


- **🔗 [khoj-alpha.netlify.app](https://khoj-alpha.netlify.app)**
- **✨ [Product Guide](https://github.com/ayush4345/Khoj/wiki/Product-Guide)**
- **📝 [Wiki](https://github.com/ayush4345/Khoj/wiki)**

## Screenshots

<table align="center">
  <tr>
    <td align="center">
      <img width="200" alt="Hunts list" src="images/hunts.png" />
      <br>
      <sub><i>Hunts list</i></sub>
    </td>
    <td align="center">
      <img width="200" alt="Hunt details" src="images/hunt-details-no-teams.png" />
      <br>
      <sub><i>Hunt details</i></sub>
    </td>
    <td align="center">
      <img width="200" alt="Creating a team" src="images/create-team.png" />
      <br>
      <sub><i>Creating a team</i></sub>
    </td>
    <td align="center">
      <img width="200" alt="Team invite code & QR" src="images/create-team-invite-code.png" />
      <br>
      <sub><i>Team invite code & QR</i></sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img width="200" alt="Join team" src="images/join-team.png" />
      <br>
      <sub><i>Join team</i></sub>
    </td>
    <td align="center">
      <img width="200" alt="Team details" src="images/team-details.png" />
      <br>
      <sub><i>Team details</i></sub>
    </td>
    <td align="center">
      <img width="200" alt="Clue" src="images/clue.png" />
      <br>
      <sub><i>Clue</i></sub>
    </td>
    <td align="center">
      <img width="200" alt="Hunt end" src="images/hunt-end.png" />
      <br>
      <sub><i>Hunt end</i></sub>
    </td>
  </tr>
</table>

## Architecture Diagram

<div align="center">
  <img src="images/main-diagram.jpeg" alt="Khoj Architecture Diagram" width="800"/>
  <br>
  <sub><i>Khoj System Architecture and Flow Diagram</i></sub>
  <br><br>
  <img src="images/hunt-creation-diagram.jpeg" alt="Hunt Creation Flow Diagram" width="800"/>
  <br>
  <sub><i>Hunt Creation Flow Diagram</i></sub>
</div>


## ✨ Key Features

### Core Gameplay
- **Progressive Riddles**: Each hunt consists of multiple interconnected clues that tell a story. 
- **Location-Based Verification**: The answer to each clue is a physical location.
- **Personalised Clues**: The clues are tailored to the user's taste using AI while still keeping the answer same.
- **Team based gameplay**: Players can form teams and invite other players to join.
- **Multiple Attempts**: Players get 3 attempts per clue to verify their location
- **Real-time Collaboration**: Built-in video chat for team coordination.
- **Rewards & Reputation**: Fastest players win rewards based on a reputation score generated which can be redeemed later.


## 📦 Application Architecture

### Frontend (`/frontend`)
- **Framework**: React 18 with TypeScript, Vite build system
- **Web3**: Thirdweb SDK v5, Wagmi, Viem for blockchain interactions
- **UI**: TailwindCSS, Radix UI primitives, Framer Motion animations
- **Key dependencies**: True Network SDK, Huddle01 React, Leaflet maps, React Router
- **True Network SDK** (`/frontend/acm`): True Network attestation algorithms

### Backend (`/backend`)
- **Framework**: Express.js with ES modules
- **Web3 Services**: Lit Protocol client, Huddle01 server SDK, Pinata IPFS
- **Key files**: `server.js` (main server), `huddle.js` (video), `pinata.js` (storage)
- **APIs**: Location verification, file uploads, video room management

### Smart Contracts (`/contracts`)
- **Framework**: Hardhat with OpenZeppelin contracts  
- **Contracts**: `Khoj.sol` (main hunt contract), `KhojNFT.sol` (NFT rewards)
- **Testing**: Comprehensive test suite in `/test/Khoj.test.js`
- **Deployment**: Multi-chain support (Moonbeam, PassetHub and Base)

```
/frontend/          - React/TypeScript Web3 frontend
  /acm/            - AssemblyScript True Network component  
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


## 🚀 Installation Instructions

1. Fork and Clone the repository:
```bash
git clone https://github.com/yourusername/Khoj.git
```


### Initial Setup Commands

```bash
# Install dependencies
cd frontend && npm install  # Takes ~90 seconds
cd ../backend && npm install  # Takes ~25 seconds  
cd ../contracts && npm install  # Takes ~15 seconds
```

### Environment Setup

1. **Backend environment**:
   ```bash
   cd backend && cp .env.example .env
   ```
   Required variables: `HUDDLE_PROJECT_ID`, `HUDDLE_API_KEY`, `PRIVATE_KEY`, `PINATA_JWT`, `PINATA_GATEWAY`, `HOST`, `PORT`, `MAX_DISTANCE_IN_METERS`

2. **Frontend environment**:
   ```bash
   cd frontend && cp .env.example .env  
   ```
   Required variables: `VITE_PUBLIC_THIRDWEB_CLIENT_ID`, `VITE_PUBLIC_HUDDLE_PROJECT_ID`, `VITE_PUBLIC_TRUE_NETWORK_SECRET_KEY`, contract addresses for Base/Moonbase/AssetHub/Flow, `VITE_PUBLIC_BACKEND_URL`, `VITE_PUBLIC_GEMINI_API_KEY`

### Khoj API keys setup

-> Huddle01 API key and ProjectID:
1.	Go to https://docs.huddle01.com/docs
2.	Navigate to API’s and click on “Get an API key”
3.	click on “Go to Huddle01 Developer Dashboard”
4.	Signin with your credentials 
5.	Choose a name for your hub and create one 
6.	Lastly click on “Production ready API key” – It will give you the API key 
7.	It will give you the project ID and the API key.

-> Private key of metamask wallet:
1.	Download the metamask extension from the chrome web store - https://chromewebstore.google.com/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en&pli=1
2.	Create an account
3.	Navigate to account details and click on private key 
4.	Copy your private key 
Note: NEVER SHARE YOUR PRIVATE KEY OR PUSH IT ON GIT

-> Pinata JWT and gateway:
1.	Visit Pinata.cloud and login with your existing credentials or create a new account.
2.	Go to developer tab and navigate to “API keys” section
3.	Click API keys and create a new API key.
4.	Enter a name for your API key and create a new API key.
5.	From the IFPS section navigate to “Gateways” and copy.

### Example .env file 
HUDDLE_PROJECT_ID=your_project_id
HUDDLE_API_KEY=your_api_key
PRIVATE_KEY=your_wallet_private_key
PINATA_JWT=your_pinata_jwt_token
PINATA_GATEWAY=https://gateway.pinata.cloud
HOST=localhost
PORT=3000
MAX_DISTANCE_IN_METERS=10000


### Running the Application

After completing the setup, you can run each component:

1. **Backend Server**:
   ```bash
   cd backend
   npm start
   ```
   The backend server will be available at `http://localhost:8000`

2. **Frontend Development Server**:
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`

3. **Smart Contracts Testing**:
   ```bash
   cd contracts
   npx hardhat test
   ```
   For more detailed contract testing options, refer to the [contracts README](/contracts/README.md)


## 👥 Team

- [Abhiraj Mengade](https://github.com/abhiraj-mengade)
- [Ayush Kumar Singh](https://github.com/ayush4345)
- [Mardav Gandhi](https://github.com/marcdhi)
- [Parth Mittal](https://github.com/mittal-parth)
- [Shubham Rasal](https://github.com/Shubham-Rasal)


Built with ❤️ by Team Khoj!
