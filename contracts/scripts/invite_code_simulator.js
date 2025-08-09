// Step 1: Deploy the contract and get the contract address
// Step 2: Create a hunt and create a team using createTeam(huntId) function. Note the teamId returned.
// Step 3: Run this script to get the invite signature and expiry.
(async function () {
    // --- Variables ---
    const teamId = 0;
    const expiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    const chainIdHex = await ethereum.request({ method: 'eth_chainId' });
    const chainId = parseInt(chainIdHex, 16); // convert hex to int
    const contractAddr = "<Contract Address>";
    const owner = (await ethereum.request({ method: 'eth_accounts' }))[0];

    // --- Encode and hash exactly like in Solidity ---
    const message = ethers.utils.solidityKeccak256(
        ["string", "uint256", "uint256", "uint256", "address"],
        ["TeamInvite", teamId, expiry, chainId, contractAddr]
    );

    // --- Sign the hash ---
    const signature = await ethereum.request({
        method: "personal_sign",
        params: [message, owner],
    });

    console.log("Signature:", signature);
    console.log("Expiry:", expiry);
})();
// Step 4: Switch to a different account in remix and run the joinWithInvite(teamId, expiry, signature) function.
// Tx should go through. Check with getTeam(huntId) function to see if the account is in the team.