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
        // Commit-reveal scheme for invites - tracks used hashes
        // false = available (not committed or committed but not revealed / used), true = revealed / used
        mapping(bytes32 => bool) inviteHashes;
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
        // NFT metadata URI for this hunt
        string nftMetadataURI;
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
        string nftMetadataURI;
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
    event InviteCommitted(
        uint256 indexed teamId,
        bytes32 indexed inviteHash
    );
    event InviteRevealed(
        uint256 indexed teamId,
        address indexed member
    );

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
        string memory _theme, // overall theme of the event that will influence the clues
        string memory _nftMetadataURI // IPFS URI for NFT metadata
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
        newHunt.nftMetadataURI = _nftMetadataURI;
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
        address _recipient
    ) public returns (uint256) {
        require(_huntId < hunts.length, "Hunt does not exist");
        // require(hunts[_huntId].startsAt > block.timestamp, "Hunt has started.");
        
        // Use the hunt's NFT metadata URI
        string memory tokenURI = hunts[_huntId].nftMetadataURI;
        require(bytes(tokenURI).length > 0, "Hunt has no NFT metadata");
        
        uint256 tokenId = nftContract.mintNFT(_recipient, tokenURI);
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
        
        // Require that the team owner has registered for the hunt
        require(hunt.participantToTokenId[msg.sender] > 0, "Must register for hunt before creating team");

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

    /* Commit invite hash for team */
    function commitTeamInviteHash(
        uint256 _teamId,
        bytes32 _inviteHash
    ) public {
        require(_teamId < nextTeamId, "Team does not exist");
        Team storage team = teams[_teamId];
        require(team.owner != address(0), "Team does not exist");
        require(team.owner == msg.sender, "Only team owner can commit invite hash");
        
        // Check that the invite hash hasn't been used before for this team
        // false = available (not committed or committed but not used), true = used
        require(!team.inviteHashes[_inviteHash], "Invite hash already used for this team");
        
        // Mark the invite hash as available (not used yet)
        team.inviteHashes[_inviteHash] = false;
        
        emit InviteCommitted(_teamId, _inviteHash);
    }

    /* Join team via secret reveal */
    function joinTeam(
        uint256 _teamId,
        string memory _secret
    ) public {
        // 1. Verify team exists
        require(_teamId < nextTeamId, "Team does not exist");
        Team storage team = teams[_teamId];
        require(team.owner != address(0), "Team does not exist");

        // 2. Verify not already in team
        require(!team.members[msg.sender], "Already in team");

        // 3. Get hunt to check team size limit
        uint256 huntId = team.huntId;
        Hunt storage hunt = hunts[huntId];

        // Verify team not full
        require(team.memberCount < hunt.maxTeamSize, "Team full");

        // 4. Generate the secret hash
        bytes32 secretHash = keccak256(
            abi.encodePacked(
                "KhojTeamInvite",
                _teamId,
                huntId,
                _secret,
                block.chainid,
                address(this)
            )
        );
        
        // 5. Verify the invite hash exists and is available
        require(!team.inviteHashes[secretHash], "Invite hash not found or already used");
        
        // 6. Mark invite hash as used for this team
        team.inviteHashes[secretHash] = true;

        // 7. Add member
        team.members[msg.sender] = true;
        team.memberCount++;
        team.membersList.push(msg.sender);
        hunt.participantToTeamId[msg.sender] = _teamId;

        emit TeamJoined(_teamId, msg.sender);
        emit InviteRevealed(_teamId, msg.sender);
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
            string memory theme,
            string memory nftMetadataURI
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
            hunt.theme,
            hunt.nftMetadataURI
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
                theme: hunt.theme,
                nftMetadataURI: hunt.nftMetadataURI
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
