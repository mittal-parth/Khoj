const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying contracts...");

  // Deploy KhojNFT contract
  const KhojNFT = await ethers.getContractFactory("KhojNFT");
  const nftContract = await KhojNFT.deploy();
  await nftContract.waitForDeployment();
  
  const nftAddress = await nftContract.getAddress();
  console.log("KhojNFT deployed to:", nftAddress);

  // Deploy Khoj contract
  const Khoj = await ethers.getContractFactory("Khoj");
  const khoj = await Khoj.deploy(nftAddress);
  await khoj.waitForDeployment();
  
  const khojAddress = await khoj.getAddress();
  console.log("Khoj deployed to:", khojAddress);

  // Verify deployment
  const contractAddress = await khoj.getContractAddress();
  const chainId = await khoj.getChainId();
  
  console.log("\nContract verification:");
  console.log("Contract address:", contractAddress);
  console.log("Chain ID:", chainId.toString());
  console.log("NFT contract address:", await khoj.nftContract());

  // Create a sample hunt for testing
  const currentTime = Math.floor(Date.now() / 1000);
  const startTime = currentTime + 3600; // 1 hour from now
  const endTime = startTime + 7200; // 3 hours from now

  const huntId = await khoj.createHunt(
    "Sample Hunt",
    "A sample treasure hunt for testing",
    startTime,
    endTime,
    "ipfs://clues123",
    "ipfs://answers123",
    true,
    4,
    "mystery",
    "ipfs://metadata123"
  );

  console.log("\nSample hunt created with ID:", huntId.toString());

  // Create a sample team
  const teamId = await khoj.createTeam(huntId, "Sample Team");
  console.log("Sample team created with ID:", teamId.toString());

  console.log("\nDeployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
