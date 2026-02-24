// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./KhojNFT.sol";

contract Khoj {
    KhojNFT public nftContract;

    /* Enums */
    enum HuntType {
        GEO_LOCATION,
        IMAGE,
        COMBINED
    }

    /* Structs */
    struct Team {
        address owner;
        uint256 huntId;
        string name;
        uint256 memberCount;
        mapping(address => bool) members;
        // We need both: mapping for O(1) membership checks, array for returning member list
        address[] membersList;
    }

    struct Hunt {
        string name;
        string description;
        uint256 startTime;
        uint256 endTime;
        string clues_blobId;
        string answers_blobId;
        address[] winners;
        uint256 noOfParticipants;
        address creator;
        address[] participantsList;
        // Team play extensions
        bool teamsEnabled;
        uint256 maxTeamSize;
        string theme;
        mapping(address => uint256) participantToTeamId;
        // Hunt-specific teams
        uint256[] teamIds;
        uint256 teamCount;
        // NFT metadata URI for this hunt
        string nftMetadataURI;
        HuntType huntType;
    }

    /* Structs for view-only data */
    struct HuntInfo {
        string name;
        string description;
        uint256 startTime;
        uint256 endTime;
        uint256 participantCount;
        string clues_blobId;
        string answers_blobId;
        bool teamsEnabled;
        uint256 maxTeamSize;
        string theme;
        string nftMetadataURI;
        address[] participants;
        HuntType huntType;
    }

    struct TeamInfo {
        uint256 huntId;
        uint256 teamId;
        string name;
        address owner;
        uint256 maxMembers;
        uint256 memberCount;
        address[] members;
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
        uint256 startTime,
        uint256 endTime
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
        nftContract = KhojNFT(_nftContractAddress);
        nextTeamId = 1;
    }

    /* Functions */

    /* Create a new hunt */
    function createHunt(
        string memory _name,
        string memory _description,
        uint256 _startTime,
        uint256 _endTime,
        string memory _clues_blobId,
        string memory _answers_blobId,
        bool _teamsEnabled,
        uint256 _maxTeamSize,
        string memory _theme, // overall theme of the event that will influence the clues
        string memory _nftMetadataURI, // IPFS URI for NFT metadata
        HuntType _huntType
    ) public returns (uint256) {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(bytes(_clues_blobId).length > 0, "Clues blob ID cannot be empty");
        require(bytes(_answers_blobId).length > 0, "Answers blob ID cannot be empty");
        require(bytes(_nftMetadataURI).length > 0, "NFT metadata URI cannot be empty");
        require(_endTime > _startTime, "End time cannot be before start time");
        if (_teamsEnabled) {
            require(_maxTeamSize > 1, "Invalid team size configuration");
        }
        hunts.push();

        Hunt storage newHunt = hunts[hunts.length - 1];
        newHunt.name = _name;
        newHunt.description = _description;
        newHunt.startTime = _startTime;
        newHunt.endTime = _endTime;
        newHunt.clues_blobId = _clues_blobId;
        newHunt.answers_blobId = _answers_blobId;
        newHunt.teamsEnabled = _teamsEnabled;
        newHunt.maxTeamSize = _maxTeamSize;
        newHunt.theme = _theme;
        newHunt.nftMetadataURI = _nftMetadataURI;
        newHunt.huntType = _huntType;
        newHunt.creator = msg.sender;

        uint256 huntId = hunts.length - 1;

        emit HuntCreated(
            huntId,
            _name,
            _description,
            _startTime,
            _endTime
        );

        return huntId;
    }

    /* Register for a hunt */
    function registerForHunt(
        uint256 _huntId,
        address _recipient
    ) public returns (uint256) {
        require(_huntId < hunts.length, "Hunt does not exist");
        // require(hunts[_huntId].startsAt > block.timestamp, "Hunt has started.");
        
        // Use the hunt's NFT metadata URI
        string memory tokenURI = hunts[_huntId].nftMetadataURI;
        require(bytes(tokenURI).length > 0, "Hunt has no NFT metadata");
        
        uint256 tokenId = nftContract.mintNFT(_recipient, tokenURI);
        hunts[_huntId].noOfParticipants++;
        // Add to participants list
        hunts[_huntId].participantsList.push(_recipient);
        emit NFTAwarded(_huntId, _recipient, tokenId);
        return tokenId;
    }

    /* Create a new team for a specific hunt */
    function createTeam(uint256 _huntId, string calldata _name) public returns (uint256 teamId) {
        // 1. Check if user is not in any team of the hunt
        _checkNotInAnyTeam(_huntId);

        // 2. Check if teams are enabled for this hunt
        Hunt storage hunt = hunts[_huntId];
        require(hunt.teamsEnabled, "Teams disabled for this hunt");

        // 3. Check if team name is valid
        require(bytes(_name).length > 0 && bytes(_name).length <= 20, "Invalid team name");

        teamId = nextTeamId;
        nextTeamId++;

        Team storage newTeam = teams[teamId];
        newTeam.owner = msg.sender;
        newTeam.huntId = _huntId;
        newTeam.name = _name;
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

        // 3. Verify not already in team
        require(!team.members[msg.sender], "Already in team");

        // Get hunt
        uint256 huntId = team.huntId;
        Hunt storage hunt = hunts[huntId];

        // 4. User should not be in any other team of the hunt
        _checkNotInAnyTeam(huntId);

        // 5. Verify team not full
        require(team.memberCount < hunt.maxTeamSize, "Team full");

        // 6. Verify signature
        require(
            verifyInviteSignature(_teamId, _expiry, _signature, team.owner),
            "Invalid signature"
        );

        // 7. Add member
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
        returns (HuntInfo memory)
    {
        require(_huntId < hunts.length, "Hunt does not exist");
        Hunt storage hunt = hunts[_huntId];
        return HuntInfo({
            name: hunt.name,
            description: hunt.description,
            startTime: hunt.startTime,
            endTime: hunt.endTime,
            participantCount: hunt.noOfParticipants,
            clues_blobId: hunt.clues_blobId,
            answers_blobId: hunt.answers_blobId,
            teamsEnabled: hunt.teamsEnabled,
            maxTeamSize: hunt.maxTeamSize,
            theme: hunt.theme,
            nftMetadataURI: hunt.nftMetadataURI,
            participants: hunt.participantsList,
            huntType: hunt.huntType
        });
    }

    /* Add winners to hunt */
    function addWinner(uint256 _huntId, address winner) public {
        require(_huntId < hunts.length, "Hunt does not exist");
        Hunt storage hunt = hunts[_huntId];
        hunt.winners.push(winner);
    }

    /* Get winners of a hunt */
    function getHuntWinners(uint256 _huntId) public view returns (address[] memory) {
        require(_huntId < hunts.length, "Hunt does not exist");
        return hunts[_huntId].winners;
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
                startTime: hunt.startTime,
                endTime: hunt.endTime,
                participantCount: hunt.noOfParticipants,
                clues_blobId: hunt.clues_blobId,
                answers_blobId: hunt.answers_blobId,
                teamsEnabled: hunt.teamsEnabled,
                maxTeamSize: hunt.maxTeamSize,
                theme: hunt.theme,
                nftMetadataURI: hunt.nftMetadataURI,
                participants: hunt.participantsList,
                huntType: hunt.huntType
            });
        }

        return allHunts;
    }

    /* Get team information for a user in a specific hunt */
    function getTeam(
        uint256 _huntId,
        address _user
    ) public view returns (TeamInfo memory) {
        require(_huntId < hunts.length, "Hunt does not exist");
        Hunt storage hunt = hunts[_huntId];

        // Get the team ID for this user in this hunt
        uint256 userTeamId = hunt.participantToTeamId[_user];
        require(userTeamId > 0, "You are not in any team for this hunt");

        Team storage team = teams[userTeamId];
        require(team.owner != address(0), "Team does not exist");
        require(team.huntId == _huntId, "Team hunt mismatch");

        return TeamInfo({
            huntId: _huntId,
            teamId: userTeamId,
            name: team.name,
            owner: team.owner,
            maxMembers: hunt.maxTeamSize,
            memberCount: team.memberCount,
            members: team.membersList
        });
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

    /* Check if user is not in any team of the hunt */
    function _checkNotInAnyTeam(uint256 _huntId) internal view {
        require(_huntId < hunts.length, "Hunt does not exist");
        require(hunts[_huntId].participantToTeamId[msg.sender] == 0, "Already in another team of the hunt");
    }

    function getContractAddress() public view returns (address) {
        return address(this);
    }

    function getChainId() public view returns (uint256) {
        return block.chainid;
    }
}
