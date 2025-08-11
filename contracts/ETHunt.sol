// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ETHuntNFT.sol";

contract ETHunt {
    ETHuntNFT public nftContract;

    /* Structs */
    struct Team {
        address owner;
        uint256 huntId;
        uint256 memberCount;
        mapping(address => bool) members;
        // We need both: mapping for O(1) membership checks, array for returning member list
        address[] membersList;
    }

    struct Hunt {
        string name;
        string description;
        uint256 startsAt;
        string clues_blobId;
        string answers_blobId;
        uint256 duration;
        address[] winners;
        uint256 noOfParticipants;
        address creator;
        mapping(address => uint256) participantToTokenId;
        // Team play extensions
        bool teamsEnabled;
        uint256 maxTeamSize;
        string theme;
        mapping(address => uint256) participantToTeamId;
        // Hunt-specific teams
        uint256[] teamIds;
        uint256 teamCount;
    }

    struct HuntInfo {
        string name;
        string description;
        uint256 startTime;
        uint256 duration;
        uint256 participantCount;
        string clues_blobId;
        string answers_blobId;
        bool teamsEnabled;
        uint256 maxTeamSize;
        string theme;
    }

    Hunt[] private hunts;

    // Global team storage
    mapping(uint256 => Team) private teams;
    uint256 private nextTeamId;

    /* Events */
    event HuntCreated(
        uint256 indexed huntId,
        string name,
        string description,
        uint256 startsAt,
        uint256 duration
    );

    event HuntStarted(uint256 indexed huntId, uint256 startedAt);
    event HuntEnded(uint256 indexed huntId, uint256 endedAt);
    event NFTAwarded(
        uint256 indexed huntId,
        address recipient,
        uint256 tokenId
    );
    event TeamCreated(
        uint256 indexed teamId,
        address indexed owner,
        uint256 maxMembers
    );
    event TeamJoined(uint256 indexed teamId, address indexed member);

    constructor(address _nftContractAddress) {
        nftContract = ETHuntNFT(_nftContractAddress);
    }

    /* Functions */

    /* Create a new hunt */
    function createHunt(
        string memory _name,
        string memory _description,
        uint256 startsAt,
        string memory _clues_blobId,
        string memory _answers_blobId,
        uint256 _duration,
        bool _teamsEnabled,
        uint256 _maxTeamSize,
        string memory _theme
    ) public returns (uint256) {
        hunts.push();

        Hunt storage newHunt = hunts[hunts.length - 1];
        newHunt.name = _name;
        newHunt.description = _description;
        newHunt.startsAt = startsAt;
        newHunt.duration = _duration;
        newHunt.clues_blobId = _clues_blobId;
        newHunt.answers_blobId = _answers_blobId;
        newHunt.teamsEnabled = _teamsEnabled;
        newHunt.maxTeamSize = _maxTeamSize;
        newHunt.theme = _theme;
        newHunt.creator = msg.sender;

        uint256 huntId = hunts.length - 1;

        emit HuntCreated(
            huntId,
            _name,
            _description,
            block.timestamp,
            _duration
        );

        return huntId;
    }

    /* Register for a hunt */
    function registerForHunt(
        uint256 _huntId,
        address _recipient,
        string memory _tokenURI
    ) public returns (uint256) {
        require(_huntId < hunts.length, "Hunt does not exist");
        // require(hunts[_huntId].startsAt > block.timestamp, "Hunt has started.");
        uint256 tokenId = nftContract.mintNFT(_recipient, _tokenURI);
        hunts[_huntId].noOfParticipants++;
        hunts[_huntId].participantToTokenId[_recipient] = tokenId;
        emit NFTAwarded(_huntId, _recipient, tokenId);
        return tokenId;
    }

    /* Create a new team for a specific hunt */
    function createTeam(uint256 _huntId) public returns (uint256 teamId) {
        require(_huntId < hunts.length, "Hunt does not exist");
        Hunt storage hunt = hunts[_huntId];
        require(hunt.teamsEnabled, "Teams disabled for this hunt");
        require(hunt.maxTeamSize > 0, "Invalid team size configuration");

        teamId = nextTeamId;
        nextTeamId++;

        Team storage newTeam = teams[teamId];
        newTeam.owner = msg.sender;
        newTeam.huntId = _huntId;
        newTeam.memberCount = 1;
        newTeam.members[msg.sender] = true;
        newTeam.membersList.push(msg.sender);

        // Add to hunt's team list
        hunt.teamIds.push(teamId);
        hunt.teamCount++;
        hunt.participantToTeamId[msg.sender] = teamId;

        emit TeamCreated(teamId, msg.sender, hunt.maxTeamSize);
        emit TeamJoined(teamId, msg.sender);

        return teamId;
    }

    /* Verify invite signature */
    function verifyInviteSignature(
        uint256 _teamId,
        uint256 _expiry,
        bytes memory _signature,
        address _expectedSigner
    ) internal view returns (bool) {
        // Create the hash that should have been signed
        bytes32 hash = keccak256(
            abi.encodePacked(
                "TeamInvite",
                _teamId,
                _expiry,
                block.chainid,
                address(this) // contract address
            )
        );

        // Add Ethereum message prefix (EIP-191)
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", hash)
        );

        require(_signature.length == 65, "Invalid signature length");

        // Extract r, s, v from signature
        // r, s: 32-byte components of ECDSA signature (elliptic curve point)
        // v: recovery ID (27 or 28) to determine which public key to recover
        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := mload(add(_signature, 32)) // First 32 bytes
            s := mload(add(_signature, 64)) // Next 32 bytes
            v := byte(0, mload(add(_signature, 96))) // Last byte
        }

        // Recover the signer's address from signature
        address recoveredSigner = ecrecover(ethSignedMessageHash, v, r, s);

        return recoveredSigner == _expectedSigner;
    }

    /* Join team via signed invite */
    function joinWithInvite(
        uint256 _teamId,
        uint256 _expiry,
        bytes memory _signature
    ) public {
        // 1. Verify expiry
        require(block.timestamp <= _expiry, "Invite expired");

        // 2. Verify team exists
        require(_teamId < nextTeamId, "Team does not exist");
        Team storage team = teams[_teamId];
        // address(0) is 0x0000...0000 - default value for non-existent mapping entries
        // If team wasn't created, owner would be address(0)
        require(team.owner != address(0), "Team does not exist");

        // 3. Verify not already in team
        require(!team.members[msg.sender], "Already in team");

        // 4. Get hunt to check team size limit
        uint256 huntId = team.huntId;
        Hunt storage hunt = hunts[huntId];

        // Verify team not full
        require(team.memberCount < hunt.maxTeamSize, "Team full");

        // 5. Verify signature
        require(
            verifyInviteSignature(_teamId, _expiry, _signature, team.owner),
            "Invalid signature"
        );

        // 6. Add member
        team.members[msg.sender] = true;
        team.memberCount++;
        team.membersList.push(msg.sender);
        hunt.participantToTeamId[msg.sender] = _teamId;

        emit TeamJoined(_teamId, msg.sender);
    }

    /* Get hunt details */
    function getHunt(
        uint256 _huntId
    )
        public
        view
        returns (
            string memory name,
            string memory description,
            uint256 startedAt,
            uint256 duration,
            uint256 noOfParticipants,
            address[] memory winners,
            string memory clues_blobId,
            string memory answers_blobId,
            bool teamsEnabled,
            uint256 maxTeamSize,
            string memory theme
        )
    {
        require(_huntId < hunts.length, "Hunt does not exist");
        Hunt storage hunt = hunts[_huntId];
        return (
            hunt.name,
            hunt.description,
            hunt.startsAt,
            hunt.duration,
            hunt.noOfParticipants,
            hunt.winners,
            hunt.clues_blobId,
            hunt.answers_blobId,
            hunt.teamsEnabled,
            hunt.maxTeamSize,
            hunt.theme
        );
    }

    /* Add winners to hunt */
    function addWinner(uint256 _huntId, address winner) public {
        require(_huntId < hunts.length, "Hunt does not exist");
        Hunt storage hunt = hunts[_huntId];
        hunt.winners.push(winner);
    }

    /* Get token ID for a participant */
    function getTokenId(
        uint256 _huntId,
        address _recipient
    ) public view returns (uint256) {
        require(_huntId < hunts.length, "Hunt does not exist");
        Hunt storage hunt = hunts[_huntId];
        return hunt.participantToTokenId[_recipient];
    }

    /* Get all hunts */
    function getAllHunts() public view returns (HuntInfo[] memory) {
        uint256 length = hunts.length;
        HuntInfo[] memory allHunts = new HuntInfo[](length);

        for (uint256 i = 0; i < length; i++) {
            Hunt storage hunt = hunts[i];
            allHunts[i] = HuntInfo({
                name: hunt.name,
                description: hunt.description,
                startTime: hunt.startsAt,
                duration: hunt.duration,
                participantCount: hunt.noOfParticipants,
                clues_blobId: hunt.clues_blobId,
                answers_blobId: hunt.answers_blobId,
                teamsEnabled: hunt.teamsEnabled,
                maxTeamSize: hunt.maxTeamSize,
                theme: hunt.theme
            });
        }

        return allHunts;
    }

    /* Get team information for a user in a specific hunt */
    function getTeam(
        uint256 _huntId
    )
        public
        view
        returns (
            uint256 teamId,
            address owner,
            uint256 maxMembers,
            uint256 memberCount,
            address[] memory members
        )
    {
        require(_huntId < hunts.length, "Hunt does not exist");
        Hunt storage hunt = hunts[_huntId];

        // Get the team ID for this user in this hunt
        uint256 userTeamId = hunt.participantToTeamId[msg.sender];
        require(
            userTeamId > 0 || (userTeamId == 0 && teams[0].members[msg.sender]),
            "You are not in any team for this hunt"
        );

        Team storage team = teams[userTeamId];
        require(team.owner != address(0), "Team does not exist");
        require(team.huntId == _huntId, "Team hunt mismatch");

        // Only team members can view their team
        require(team.members[msg.sender], "Access denied");

        return (
            userTeamId,
            team.owner,
            hunt.maxTeamSize,
            team.memberCount,
            team.membersList
        );
    }

    /* Check if address is member of team */
    function isTeamMember(
        uint256 _teamId,
        address _member
    ) public view returns (bool) {
        require(_teamId < nextTeamId, "Team does not exist");
        return teams[_teamId].members[_member];
    }

    /* Get teams for a specific hunt */
    function getHuntTeams(
        uint256 _huntId
    ) public view returns (uint256[] memory) {
        require(_huntId < hunts.length, "Hunt does not exist");
        return hunts[_huntId].teamIds;
    }

    /* Get team count for a specific hunt */
    function getHuntTeamCount(uint256 _huntId) public view returns (uint256) {
        require(_huntId < hunts.length, "Hunt does not exist");
        return hunts[_huntId].teamCount;
    }

    /* Get which team a participant belongs to in a hunt */
    function getParticipantTeamId(
        uint256 _huntId,
        address _participant
    ) public view returns (uint256) {
        require(_huntId < hunts.length, "Hunt does not exist");
        return hunts[_huntId].participantToTeamId[_participant];
    }
}
