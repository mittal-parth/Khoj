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
  const [deployer] = await ethers.getSigners();
  
  const khojAddress = await khoj.getAddress();
  console.log("Khoj deployed to:", khojAddress);

  // Verify deployment (use provider to avoid RPC quirks on L2)
  const contractAddress = await khoj.getAddress();
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId;

  console.log("\nContract verification:");
  console.log("Contract address:", contractAddress);
  console.log("Chain ID:", chainId.toString());
  console.log("NFT contract address:", nftAddress);

  // Create a sample hunt for testing
  const currentTime = Math.floor(Date.now() / 1000);
  const startTime = currentTime + 3600; // 1 hour from now
  const endTime = startTime + 7200; // 3 hours from now

  const createHuntTx = await khoj.createHunt(
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
  const huntReceipt = await createHuntTx.wait();

  let huntId;
  for (const log of huntReceipt.logs) {
    try {
      const parsed = khoj.interface.parseLog(log);
      if (parsed && parsed.name === "HuntCreated") {
        huntId = parsed.args.huntId;
        break;
      }
    } catch (e) { /* ignore non-matching logs */ }
  }

  if (huntId === undefined) {
    const allHunts = await khoj.getAllHunts();
    huntId = BigInt(allHunts.length - 1);
  }

  console.log("\nSample hunt created with ID:", huntId.toString());

  // Create a sample team
  const createTeamTx = await khoj.createTeam(huntId, "Sample Team");
  const teamReceipt = await createTeamTx.wait();
  let teamId;
  for (const log of teamReceipt.logs) {
    try {
      const parsed = khoj.interface.parseLog(log);
      if (parsed && parsed.name === "TeamCreated") {
        teamId = parsed.args.teamId;
        break;
      }
    } catch (e) { /* ignore non-matching logs */ }
  }
  console.log("Sample team created with ID:", teamId ? teamId.toString() : "unknown");

  // Log the team name from the contract state
  try {
    const teamInfo = await khoj.getTeam(huntId, deployer.address);
    console.log("Sample team name:", teamInfo.name);
  } catch (e) {
    console.log("Could not fetch team name:", e.message);
  }

  console.log("\nDeployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
