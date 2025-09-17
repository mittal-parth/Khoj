const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Khoj Contract", function () {
  let khoj, nftContract;
  let owner, addr1, addr2, addr3, addr4;
  let huntId, teamId;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();

    // Deploy KhojNFT contract
    const KhojNFT = await ethers.getContractFactory("KhojNFT");
    nftContract = await KhojNFT.deploy();
    await nftContract.waitForDeployment();

    // Deploy Khoj contract
    const Khoj = await ethers.getContractFactory("Khoj");
    khoj = await Khoj.deploy(await nftContract.getAddress());
    await khoj.waitForDeployment();
  });

  describe("Constructor", function () {
    it("Should set the correct NFT contract address", async function () {
      expect(await khoj.nftContract()).to.equal(await nftContract.getAddress());
    });

    it("Should initialize nextTeamId to 1", async function () {
      // We can verify this by creating a team and checking the teamId
      const currentTime = await time.latest();
      const startTime = currentTime + 3600; // 1 hour from now
      const endTime = startTime + 7200; // 3 hours from now

      await khoj.createHunt(
        "Test Hunt",
        "Test Description",
        startTime,
        endTime,
        "clues123",
        "answers123",
        true,
        4,
        "mystery",
        "ipfs://metadata123"
      );

      // Create a team and verify the team ID by checking the team data
      await khoj.createTeam(0);
      
      // Verify the team was created with ID 1 by checking team data
      const team = await khoj.getTeam(0, owner.address);
      expect(team.teamId).to.equal(1);
    });
  });

  describe("Hunt Creation", function () {
    beforeEach(async function () {
      const currentTime = await time.latest();
      const startTime = currentTime + 3600; // 1 hour from now
      const endTime = startTime + 7200; // 3 hours from now

      // Create the hunt
      await khoj.createHunt(
        "Test Hunt",
        "Test Description",
        startTime,
        endTime,
        "clues123",
        "answers123",
        true,
        4,
        "mystery",
        "ipfs://metadata123"
      );
      
      // Set huntId to 0 since it's the first hunt
      huntId = 0;
    });

    it("Should create a hunt successfully", async function () {
      // Verify hunt was created by checking hunt data
      const hunt = await khoj.getHunt(0);
      expect(hunt.name).to.equal("Test Hunt");
      expect(hunt.description).to.equal("Test Description");
      expect(hunt.teamsEnabled).to.be.true;
      expect(hunt.maxTeamSize).to.equal(4);
      expect(hunt.theme).to.equal("mystery");
      expect(hunt.nftMetadataURI).to.equal("ipfs://metadata123");
      expect(hunt.participantCount).to.equal(0);
    });

    it("Should emit HuntCreated event", async function () {
      const currentTime = await time.latest();
      const startTime = currentTime + 3600;
      const endTime = startTime + 7200;

      await expect(
        khoj.createHunt(
          "Event Test Hunt",
          "Event Test Description",
          startTime,
          endTime,
          "clues456",
          "answers456",
          false,
          1,
          "adventure",
          "ipfs://metadata456"
        )
      )
        .to.emit(khoj, "HuntCreated")
        .withArgs(1, "Event Test Hunt", "Event Test Description", startTime, endTime);
    });

    it("Should reject empty name", async function () {
      const currentTime = await time.latest();
      const startTime = currentTime + 3600;
      const endTime = startTime + 7200;

      await expect(
        khoj.createHunt(
          "",
          "Test Description",
          startTime,
          endTime,
          "clues123",
          "answers123",
          true,
          4,
          "mystery",
          "ipfs://metadata123"
        )
      ).to.be.revertedWith("Name cannot be empty");
    });

    it("Should reject empty description", async function () {
      const currentTime = await time.latest();
      const startTime = currentTime + 3600;
      const endTime = startTime + 7200;

      await expect(
        khoj.createHunt(
          "Test Hunt",
          "",
          startTime,
          endTime,
          "clues123",
          "answers123",
          true,
          4,
          "mystery",
          "ipfs://metadata123"
        )
      ).to.be.revertedWith("Description cannot be empty");
    });

    it("Should reject empty clues blob ID", async function () {
      const currentTime = await time.latest();
      const startTime = currentTime + 3600;
      const endTime = startTime + 7200;

      await expect(
        khoj.createHunt(
          "Test Hunt",
          "Test Description",
          startTime,
          endTime,
          "",
          "answers123",
          true,
          4,
          "mystery",
          "ipfs://metadata123"
        )
      ).to.be.revertedWith("Clues blob ID cannot be empty");
    });

    it("Should reject empty answers blob ID", async function () {
      const currentTime = await time.latest();
      const startTime = currentTime + 3600;
      const endTime = startTime + 7200;

      await expect(
        khoj.createHunt(
          "Test Hunt",
          "Test Description",
          startTime,
          endTime,
          "clues123",
          "",
          true,
          4,
          "mystery",
          "ipfs://metadata123"
        )
      ).to.be.revertedWith("Answers blob ID cannot be empty");
    });

    it("Should reject empty NFT metadata URI", async function () {
      const currentTime = await time.latest();
      const startTime = currentTime + 3600;
      const endTime = startTime + 7200;

      await expect(
        khoj.createHunt(
          "Test Hunt",
          "Test Description",
          startTime,
          endTime,
          "clues123",
          "answers123",
          true,
          4,
          "mystery",
          ""
        )
      ).to.be.revertedWith("NFT metadata URI cannot be empty");
    });

    it("Should reject end time before start time", async function () {
      const currentTime = await time.latest();
      const startTime = currentTime + 3600;
      const endTime = startTime - 1800; // 30 minutes before start

      await expect(
        khoj.createHunt(
          "Test Hunt",
          "Test Description",
          startTime,
          endTime,
          "clues123",
          "answers123",
          true,
          4,
          "mystery",
          "ipfs://metadata123"
        )
      ).to.be.revertedWith("End time cannot be before start time");
    });

    it("Should reject invalid team size when teams enabled", async function () {
      const currentTime = await time.latest();
      const startTime = currentTime + 3600;
      const endTime = startTime + 7200;

      await expect(
        khoj.createHunt(
          "Test Hunt",
          "Test Description",
          startTime,
          endTime,
          "clues123",
          "answers123",
          true,
          1, // Invalid team size
          "mystery",
          "ipfs://metadata123"
        )
      ).to.be.revertedWith("Invalid team size configuration");
    });

    it("Should allow team size 1 when teams disabled", async function () {
      const currentTime = await time.latest();
      const startTime = currentTime + 3600;
      const endTime = startTime + 7200;

      await khoj.createHunt(
        "Test Hunt",
        "Test Description",
        startTime,
        endTime,
        "clues123",
        "answers123",
        false,
        1, // Valid when teams disabled
        "mystery",
        "ipfs://metadata123"
      );

      // Verify hunt was created by checking hunt data
      const hunt = await khoj.getHunt(1);
      expect(hunt.name).to.equal("Test Hunt");
      expect(hunt.teamsEnabled).to.be.false;
      expect(hunt.maxTeamSize).to.equal(1);
    });
  });

  describe("Hunt Registration", function () {
    beforeEach(async function () {
      const currentTime = await time.latest();
      const startTime = currentTime + 3600;
      const endTime = startTime + 7200;

      huntId = await khoj.createHunt(
        "Test Hunt",
        "Test Description",
        startTime,
        endTime,
        "clues123",
        "answers123",
        true,
        4,
        "mystery",
        "ipfs://metadata123"
      );
    });

    it("Should register for hunt successfully", async function () {
      const tx = await khoj.registerForHunt(0, addr1.address);
      await expect(tx)
        .to.emit(khoj, "NFTAwarded")
        .withArgs(0, addr1.address, 0);

      const hunt = await khoj.getHunt(0);
      expect(hunt.participantCount).to.equal(1);
      expect(hunt.participants[0]).to.equal(addr1.address);
    });

    it("Should reject registration for non-existent hunt", async function () {
      await expect(
        khoj.registerForHunt(999, addr1.address)
      ).to.be.revertedWith("Hunt does not exist");
    });

    it("Should reject registration with empty NFT metadata", async function () {
      // Create hunt with empty NFT metadata
      const currentTime = await time.latest();
      const startTime = currentTime + 3600;
      const endTime = startTime + 7200;

      // We need to create a hunt with empty metadata, but the contract prevents this
      // This test verifies the validation works
      await expect(
        khoj.createHunt(
          "Test Hunt",
          "Test Description",
          startTime,
          endTime,
          "clues123",
          "answers123",
          true,
          4,
          "mystery",
          ""
        )
      ).to.be.revertedWith("NFT metadata URI cannot be empty");
    });

    it("Should increment participant count on registration", async function () {
      await khoj.registerForHunt(0, addr1.address);
      await khoj.registerForHunt(0, addr2.address);
      await khoj.registerForHunt(0, addr3.address);

      const hunt = await khoj.getHunt(0);
      expect(hunt.participantCount).to.equal(3);
      expect(hunt.participants).to.include(addr1.address);
      expect(hunt.participants).to.include(addr2.address);
      expect(hunt.participants).to.include(addr3.address);
    });
  });

  describe("Team Creation", function () {
    beforeEach(async function () {
      const currentTime = await time.latest();
      const startTime = currentTime + 3600;
      const endTime = startTime + 7200;

      huntId = await khoj.createHunt(
        "Test Hunt",
        "Test Description",
        startTime,
        endTime,
        "clues123",
        "answers123",
        true,
        4,
        "mystery",
        "ipfs://metadata123"
      );
    });

    it("Should create team successfully", async function () {
      const tx = await khoj.createTeam(0);
      await expect(tx)
        .to.emit(khoj, "TeamCreated")
        .withArgs(1, owner.address, 4);
      
      await expect(tx)
        .to.emit(khoj, "TeamJoined")
        .withArgs(1, owner.address);

      // Verify team was created by checking team data
      const team = await khoj.getTeam(0, owner.address);
      expect(team.teamId).to.equal(1);
      expect(team.owner).to.equal(owner.address);
      expect(team.maxMembers).to.equal(4);
      expect(team.memberCount).to.equal(1);

      const teamCount = await khoj.getHuntTeamCount(0);
      expect(teamCount).to.equal(1);
      
      const teamIds = await khoj.getHuntTeams(0);
      expect(teamIds.length).to.equal(1);
      expect(teamIds[0]).to.equal(1);
    });

    it("Should reject team creation when teams disabled", async function () {
      // Create hunt with teams disabled
      const currentTime = await time.latest();
      const startTime = currentTime + 3600;
      const endTime = startTime + 7200;

      await khoj.createHunt(
        "No Teams Hunt",
        "Description",
        startTime,
        endTime,
        "clues123",
        "answers123",
        false, // Teams disabled
        1,
        "mystery",
        "ipfs://metadata123"
      );

      await expect(
        khoj.createTeam(1) // Hunt ID 1
      ).to.be.revertedWith("Teams disabled for this hunt");
    });

    it("Should reject team creation for non-existent hunt", async function () {
      await expect(
        khoj.createTeam(999)
      ).to.be.revertedWith("Hunt does not exist");
    });

    it("Should reject creating multiple teams by same user", async function () {
      await khoj.createTeam(0);
      
      await expect(
        khoj.createTeam(0)
      ).to.be.revertedWith("Already in another team of the hunt");
    });

    it("Should set correct team data", async function () {
      await khoj.createTeam(0);
      
      const team = await khoj.getTeam(0, owner.address);
      expect(team.huntId).to.equal(0);
      expect(team.teamId).to.equal(1);
      expect(team.owner).to.equal(owner.address);
      expect(team.maxMembers).to.equal(4);
      expect(team.memberCount).to.equal(1);
      expect(team.members[0]).to.equal(owner.address);
    });

    it("Should increment team count in hunt", async function () {
      expect(await khoj.getHuntTeamCount(0)).to.equal(0);
      
      await khoj.createTeam(0);
      expect(await khoj.getHuntTeamCount(0)).to.equal(1);
    });

    it("Should add team to hunt's team list", async function () {
      await khoj.createTeam(0);
      
      const teamIds = await khoj.getHuntTeams(0);
      expect(teamIds.length).to.equal(1);
      expect(teamIds[0]).to.equal(1);
    });
  });

  describe("Team Joining with Invites", function () {
    let signature, expiry;

    beforeEach(async function () {
      const currentTime = await time.latest();
      const startTime = currentTime + 3600;
      const endTime = startTime + 7200;

      await khoj.createHunt(
        "Test Hunt",
        "Test Description",
        startTime,
        endTime,
        "clues123",
        "answers123",
        true,
        4,
        "mystery",
        "ipfs://metadata123"
      );

      await khoj.createTeam(0);
      huntId = 0;
      teamId = 1; // First team will have ID 1
      
      // Create valid signature for team invite
      expiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const chainId = await khoj.getChainId();
      const contractAddr = await khoj.getContractAddress();
      
      const message = ethers.solidityPackedKeccak256(
        ["string", "uint256", "uint256", "uint256", "address"],
        ["TeamInvite", teamId, expiry, chainId, contractAddr]
      );
      
      signature = await owner.signMessage(ethers.getBytes(message));
    });

    it("Should join team with valid invite", async function () {
      await expect(
        khoj.connect(addr1).joinWithInvite(teamId, expiry, signature)
      )
        .to.emit(khoj, "TeamJoined")
        .withArgs(teamId, addr1.address);

      const team = await khoj.getTeam(0, addr1.address);
      expect(team.teamId).to.equal(teamId);
      expect(team.memberCount).to.equal(2);
      expect(team.members).to.include(addr1.address);
    });

    it("Should reject expired invite", async function () {
      const expiredExpiry = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      
      await expect(
        khoj.connect(addr1).joinWithInvite(teamId, expiredExpiry, signature)
      ).to.be.revertedWith("Invite expired");
    });

    it("Should reject invite for non-existent team", async function () {
      await expect(
        khoj.connect(addr1).joinWithInvite(999, expiry, signature)
      ).to.be.revertedWith("Team does not exist");
    });

    it("Should reject joining if already in team", async function () {
      await khoj.connect(addr1).joinWithInvite(teamId, expiry, signature);
      
      await expect(
        khoj.connect(addr1).joinWithInvite(teamId, expiry, signature)
      ).to.be.revertedWith("Already in team");
    });

    it("Should reject joining if in another team of same hunt", async function () {
      // Create another team
      await khoj.connect(addr2).createTeam(0);
      
      // Get the team ID for addr2
      const teamId2 = await khoj.getParticipantTeamId(0, addr2.address);
      
      // Create signature for second team
      const message2 = ethers.solidityPackedKeccak256(
        ["string", "uint256", "uint256", "uint256", "address"],
        ["TeamInvite", teamId2, expiry, await khoj.getChainId(), await khoj.getContractAddress()]
      );
      const signature2 = await addr2.signMessage(ethers.getBytes(message2));
      
      // Join first team
      await khoj.connect(addr1).joinWithInvite(teamId, expiry, signature);
      
      // Try to join second team
      await expect(
        khoj.connect(addr1).joinWithInvite(teamId2, expiry, signature2)
      ).to.be.revertedWith("Already in another team of the hunt");
    });

    it("Should reject joining when team is full", async function () {
      // Create team with max size 2
      const currentTime = await time.latest();
      const startTime = currentTime + 3600;
      const endTime = startTime + 7200;

      await khoj.createHunt(
        "Small Hunt",
        "Description",
        startTime,
        endTime,
        "clues123",
        "answers123",
        true,
        2, // Max team size 2
        "mystery",
        "ipfs://metadata123"
      );

      await khoj.createTeam(1); // Hunt ID 1
      
      // Get the team ID for the owner
      const smallTeamId = await khoj.getParticipantTeamId(1, owner.address);
      
      // Create signature for small team
      const message = ethers.solidityPackedKeccak256(
        ["string", "uint256", "uint256", "uint256", "address"],
        ["TeamInvite", smallTeamId, expiry, await khoj.getChainId(), await khoj.getContractAddress()]
      );
      const smallTeamSignature = await owner.signMessage(ethers.getBytes(message));
      
      // Fill the team
      await khoj.connect(addr1).joinWithInvite(smallTeamId, expiry, smallTeamSignature);
      
      // Try to add third member
      await expect(
        khoj.connect(addr2).joinWithInvite(smallTeamId, expiry, smallTeamSignature)
      ).to.be.revertedWith("Team full");
    });

    it("Should reject invalid signature", async function () {
      const invalidSignature = "0x" + "1".repeat(130); // Invalid signature
      
      await expect(
        khoj.connect(addr1).joinWithInvite(teamId, expiry, invalidSignature)
      ).to.be.revertedWith("Invalid signature");
    });

    it("Should reject signature from wrong signer", async function () {
      // Create signature with different signer
      const message = ethers.solidityPackedKeccak256(
        ["string", "uint256", "uint256", "uint256", "address"],
        ["TeamInvite", teamId, expiry, await khoj.getChainId(), await khoj.getContractAddress()]
      );
      const wrongSignature = await addr2.signMessage(ethers.getBytes(message));
      
      await expect(
        khoj.connect(addr1).joinWithInvite(teamId, expiry, wrongSignature)
      ).to.be.revertedWith("Invalid signature");
    });

    it("Should reject signature with wrong team ID", async function () {
      // Create signature for different team
      const message = ethers.solidityPackedKeccak256(
        ["string", "uint256", "uint256", "uint256", "address"],
        ["TeamInvite", 999, expiry, await khoj.getChainId(), await khoj.getContractAddress()]
      );
      const wrongTeamSignature = await owner.signMessage(ethers.getBytes(message));
      
      await expect(
        khoj.connect(addr1).joinWithInvite(teamId, expiry, wrongTeamSignature)
      ).to.be.revertedWith("Invalid signature");
    });

    it("Should reject signature with wrong expiry", async function () {
      // Create signature with different expiry
      const differentExpiry = expiry + 3600;
      const message = ethers.solidityPackedKeccak256(
        ["string", "uint256", "uint256", "uint256", "address"],
        ["TeamInvite", teamId, differentExpiry, await khoj.getChainId(), await khoj.getContractAddress()]
      );
      const wrongExpirySignature = await owner.signMessage(ethers.getBytes(message));
      
      await expect(
        khoj.connect(addr1).joinWithInvite(teamId, expiry, wrongExpirySignature)
      ).to.be.revertedWith("Invalid signature");
    });

    it("Should reject signature with wrong chain ID", async function () {
      // Create signature with different chain ID
      const message = ethers.solidityPackedKeccak256(
        ["string", "uint256", "uint256", "uint256", "address"],
        ["TeamInvite", teamId, expiry, 999, await khoj.getContractAddress()]
      );
      const wrongChainSignature = await owner.signMessage(ethers.getBytes(message));
      
      await expect(
        khoj.connect(addr1).joinWithInvite(teamId, expiry, wrongChainSignature)
      ).to.be.revertedWith("Invalid signature");
    });

    it("Should reject signature with wrong contract address", async function () {
      // Create signature with different contract address
      const message = ethers.solidityPackedKeccak256(
        ["string", "uint256", "uint256", "uint256", "address"],
        ["TeamInvite", teamId, expiry, await khoj.getChainId(), addr1.address]
      );
      const wrongContractSignature = await owner.signMessage(ethers.getBytes(message));
      
      await expect(
        khoj.connect(addr1).joinWithInvite(teamId, expiry, wrongContractSignature)
      ).to.be.revertedWith("Invalid signature");
    });

    it("Should reject signature with wrong message prefix", async function () {
      // Create signature with wrong message
      const message = ethers.solidityPackedKeccak256(
        ["string", "uint256", "uint256", "uint256", "address"],
        ["WrongPrefix", teamId, expiry, await khoj.getChainId(), await khoj.getContractAddress()]
      );
      const wrongPrefixSignature = await owner.signMessage(ethers.getBytes(message));
      
      await expect(
        khoj.connect(addr1).joinWithInvite(teamId, expiry, wrongPrefixSignature)
      ).to.be.revertedWith("Invalid signature");
    });

    it("Should reject signature with invalid length", async function () {
      const invalidSignature = "0x1234"; // Too short
      
      await expect(
        khoj.connect(addr1).joinWithInvite(teamId, expiry, invalidSignature)
      ).to.be.revertedWith("Invalid signature length");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      const currentTime = await time.latest();
      const startTime = currentTime + 3600;
      const endTime = startTime + 7200;

      await khoj.createHunt(
        "Test Hunt",
        "Test Description",
        startTime,
        endTime,
        "clues123",
        "answers123",
        true,
        4,
        "mystery",
        "ipfs://metadata123"
      );

      await khoj.createTeam(0);
      
      // Get the actual IDs using getter functions
      huntId = 0; // First hunt has ID 0
      teamId = await khoj.getParticipantTeamId(0, owner.address);
    });

    describe("getHunt", function () {
      it("Should return correct hunt information", async function () {
        const hunt = await khoj.getHunt(0);
        
        expect(hunt.name).to.equal("Test Hunt");
        expect(hunt.description).to.equal("Test Description");
        expect(hunt.teamsEnabled).to.be.true;
        expect(hunt.maxTeamSize).to.equal(4);
        expect(hunt.theme).to.equal("mystery");
        expect(hunt.nftMetadataURI).to.equal("ipfs://metadata123");
        expect(hunt.participantCount).to.equal(0);
      });

      it("Should reject non-existent hunt", async function () {
        await expect(
          khoj.getHunt(999)
        ).to.be.revertedWith("Hunt does not exist");
      });
    });

    describe("getAllHunts", function () {
      it("Should return all hunts", async function () {
        const currentTime = await time.latest();
        const startTime = currentTime + 3600;
        const endTime = startTime + 7200;

        // Create second hunt
        await khoj.createHunt(
          "Second Hunt",
          "Second Description",
          startTime,
          endTime,
          "clues456",
          "answers456",
          false,
          1,
          "adventure",
          "ipfs://metadata456"
        );

        const allHunts = await khoj.getAllHunts();
        expect(allHunts.length).to.equal(2);
        expect(allHunts[0].name).to.equal("Test Hunt");
        expect(allHunts[1].name).to.equal("Second Hunt");
      });

      it("Should return empty array when no hunts", async function () {
        // Deploy new contract with no hunts
        const KhojNFT = await ethers.getContractFactory("KhojNFT");
        const newNftContract = await KhojNFT.deploy();
        await newNftContract.waitForDeployment();

        const Khoj = await ethers.getContractFactory("Khoj");
        const newKhoj = await Khoj.deploy(await newNftContract.getAddress());
        await newKhoj.waitForDeployment();

        const allHunts = await newKhoj.getAllHunts();
        expect(allHunts.length).to.equal(0);
      });
    });

    describe("getTeam", function () {
      it("Should return team information for team member", async function () {
        const team = await khoj.getTeam(0, owner.address);
        
        expect(team.huntId).to.equal(0);
        expect(team.teamId).to.equal(teamId);
        expect(team.owner).to.equal(owner.address);
        expect(team.maxMembers).to.equal(4);
        expect(team.memberCount).to.equal(1);
        expect(team.members[0]).to.equal(owner.address);
      });

      it("Should reject non-existent hunt", async function () {
        await expect(
          khoj.getTeam(999, owner.address)
        ).to.be.revertedWith("Hunt does not exist");
      });

      it("Should reject user not in any team", async function () {
        await expect(
          khoj.getTeam(0, addr1.address)
        ).to.be.revertedWith("You are not in any team for this hunt");
      });

      it("Should reject access by non-member", async function () {
        // Create another team
        const teamId2 = await khoj.connect(addr1).createTeam(0);
        
        // Try to access team info from non-member
        await expect(
          khoj.getTeam(0, addr2.address)
        ).to.be.revertedWith("You are not in any team for this hunt");
      });
    });

    describe("isTeamMember", function () {
      it("Should return true for team member", async function () {
        expect(await khoj.isTeamMember(teamId, owner.address)).to.be.true;
      });

      it("Should return false for non-member", async function () {
        expect(await khoj.isTeamMember(teamId, addr1.address)).to.be.false;
      });

      it("Should reject non-existent team", async function () {
        await expect(
          khoj.isTeamMember(999, owner.address)
        ).to.be.revertedWith("Team does not exist");
      });
    });

    describe("getHuntTeams", function () {
      it("Should return team IDs for hunt", async function () {
        const teamIds = await khoj.getHuntTeams(0);
        expect(teamIds.length).to.equal(1);
        expect(teamIds[0]).to.equal(teamId);
      });

      it("Should reject non-existent hunt", async function () {
        await expect(
          khoj.getHuntTeams(999)
        ).to.be.revertedWith("Hunt does not exist");
      });
    });

    describe("getHuntTeamCount", function () {
      it("Should return correct team count", async function () {
        expect(await khoj.getHuntTeamCount(0)).to.equal(1);
      });

      it("Should reject non-existent hunt", async function () {
        await expect(
          khoj.getHuntTeamCount(999)
        ).to.be.revertedWith("Hunt does not exist");
      });
    });

    describe("getParticipantTeamId", function () {
      it("Should return team ID for participant", async function () {
        const participantTeamId = await khoj.getParticipantTeamId(0, owner.address);
        expect(participantTeamId).to.equal(teamId);
      });

      it("Should return 0 for non-participant", async function () {
        const participantTeamId = await khoj.getParticipantTeamId(0, addr1.address);
        expect(participantTeamId).to.equal(0);
      });

      it("Should reject non-existent hunt", async function () {
        await expect(
          khoj.getParticipantTeamId(999, owner.address)
        ).to.be.revertedWith("Hunt does not exist");
      });
    });
  });

  describe("Winner Management", function () {
    beforeEach(async function () {
      const currentTime = await time.latest();
      const startTime = currentTime + 3600;
      const endTime = startTime + 7200;

      huntId = await khoj.createHunt(
        "Test Hunt",
        "Test Description",
        startTime,
        endTime,
        "clues123",
        "answers123",
        true,
        4,
        "mystery",
        "ipfs://metadata123"
      );
    });

    it("Should add winner successfully", async function () {
      await khoj.addWinner(0, addr1.address);
      
      const winners = await khoj.getHuntWinners(0);
      expect(winners).to.include(addr1.address);
    });

    it("Should add multiple winners", async function () {
      await khoj.addWinner(0, addr1.address);
      await khoj.addWinner(0, addr2.address);
      await khoj.addWinner(0, addr3.address);
      
      const winners = await khoj.getHuntWinners(0);
      expect(winners.length).to.equal(3);
      expect(winners).to.include(addr1.address);
      expect(winners).to.include(addr2.address);
      expect(winners).to.include(addr3.address);
    });

    it("Should reject adding winner to non-existent hunt", async function () {
      await expect(
        khoj.addWinner(999, addr1.address)
      ).to.be.revertedWith("Hunt does not exist");
    });
  });

  describe("Utility Functions", function () {
    it("Should return correct contract address", async function () {
      const contractAddr = await khoj.getContractAddress();
      expect(contractAddr).to.equal(await khoj.getAddress());
    });

    it("Should return correct chain ID", async function () {
      const chainId = await khoj.getChainId();
      expect(chainId).to.equal(await ethers.provider.getNetwork().then(n => n.chainId));
    });
  });

  describe("Edge Cases and Stress Tests", function () {
    it("Should handle maximum team size", async function () {
      const currentTime = await time.latest();
      const startTime = currentTime + 3600;
      const endTime = startTime + 7200;

      await khoj.createHunt(
        "Max Team Hunt",
        "Description",
        startTime,
        endTime,
        "clues123",
        "answers123",
        true,
        5, // Team size 5 (owner + 4 others)
        "mystery",
        "ipfs://metadata123"
      );

      await khoj.createTeam(0); // Hunt ID 0 (this will be the first hunt in this test)
      
      // Get the team ID for the owner
      const teamId = await khoj.getParticipantTeamId(0, owner.address);
      
      // Create signature for team
      const expiry = Math.floor(Date.now() / 1000) + 3600;
      const message = ethers.solidityPackedKeccak256(
        ["string", "uint256", "uint256", "uint256", "address"],
        ["TeamInvite", teamId, expiry, await khoj.getChainId(), await khoj.getContractAddress()]
      );
      const signature = await owner.signMessage(ethers.getBytes(message));

      // Add 4 more members (team owner + 4 = 5 total)
      const testAddresses = [addr1, addr2, addr3, addr4];
      for (let i = 0; i < 4; i++) {
        await khoj.connect(testAddresses[i]).joinWithInvite(teamId, expiry, signature);
      }

      const team = await khoj.getTeam(0, owner.address);
      expect(team.memberCount).to.equal(5);
    });

    it("Should handle multiple teams in same hunt", async function () {
      const currentTime = await time.latest();
      const startTime = currentTime + 3600;
      const endTime = startTime + 7200;

      await khoj.createHunt(
        "Multi Team Hunt",
        "Description",
        startTime,
        endTime,
        "clues123",
        "answers123",
        true,
        4,
        "mystery",
        "ipfs://metadata123"
      );

      // Create multiple teams
      await khoj.createTeam(0); // Hunt ID 0 (this will be the first hunt in this test)
      await khoj.connect(addr1).createTeam(0);
      await khoj.connect(addr2).createTeam(0);
      
      // Get team IDs using getter functions
      const team1 = await khoj.getParticipantTeamId(0, owner.address);
      const team2 = await khoj.getParticipantTeamId(0, addr1.address);
      const team3 = await khoj.getParticipantTeamId(0, addr2.address);

      expect(await khoj.getHuntTeamCount(0)).to.equal(3);
      
      const teamIds = await khoj.getHuntTeams(0);
      expect(teamIds).to.include(team1);
      expect(teamIds).to.include(team2);
      expect(teamIds).to.include(team3);
    });

    it("Should handle large number of hunts", async function () {
      const currentTime = await time.latest();
      const startTime = currentTime + 3600;
      const endTime = startTime + 7200;

      // Create 10 hunts
      for (let i = 0; i < 10; i++) {
        await khoj.createHunt(
          `Hunt ${i}`,
          `Description ${i}`,
          startTime,
          endTime,
          `clues${i}`,
          `answers${i}`,
          true,
          4,
          "mystery",
          `ipfs://metadata${i}`
        );
      }

      const allHunts = await khoj.getAllHunts();
      expect(allHunts.length).to.equal(10);
      
      for (let i = 0; i < 10; i++) {
        expect(allHunts[i].name).to.equal(`Hunt ${i}`);
      }
    });
  });
});
