export const huntABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_nftContractAddress",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "huntId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "description",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "startTime",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "endTime",
        type: "uint256",
      },
    ],
    name: "HuntCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "huntId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "endedAt",
        type: "uint256",
      },
    ],
    name: "HuntEnded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "huntId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "startedAt",
        type: "uint256",
      },
    ],
    name: "HuntStarted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "huntId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "NFTAwarded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "teamId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "maxMembers",
        type: "uint256",
      },
    ],
    name: "TeamCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "teamId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "member",
        type: "address",
      },
    ],
    name: "TeamJoined",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_huntId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "winner",
        type: "address",
      },
    ],
    name: "addWinner",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_name",
        type: "string",
      },
      {
        internalType: "string",
        name: "_description",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "_startTime",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_endTime",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "_clues_blobId",
        type: "string",
      },
      {
        internalType: "string",
        name: "_answers_blobId",
        type: "string",
      },
      {
        internalType: "bool",
        name: "_teamsEnabled",
        type: "bool",
      },
      {
        internalType: "uint256",
        name: "_maxTeamSize",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "_theme",
        type: "string",
      },
      {
        internalType: "string",
        name: "_nftMetadataURI",
        type: "string",
      },
    ],
    name: "createHunt",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_huntId",
        type: "uint256",
      },
    ],
    name: "createTeam",
    outputs: [
      {
        internalType: "uint256",
        name: "teamId",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getAllHunts",
    outputs: [
      {
        components: [
          {
            internalType: "string",
            name: "name",
            type: "string",
          },
          {
            internalType: "string",
            name: "description",
            type: "string",
          },
          {
            internalType: "uint256",
            name: "startTime",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "endTime",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "participantCount",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "clues_blobId",
            type: "string",
          },
          {
            internalType: "string",
            name: "answers_blobId",
            type: "string",
          },
          {
            internalType: "bool",
            name: "teamsEnabled",
            type: "bool",
          },
          {
            internalType: "uint256",
            name: "maxTeamSize",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "theme",
            type: "string",
          },
          {
            internalType: "string",
            name: "nftMetadataURI",
            type: "string",
          },
          {
            internalType: "address[]",
            name: "participants",
            type: "address[]",
          },
        ],
        internalType: "struct Khoj.HuntInfo[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_huntId",
        type: "uint256",
      },
    ],
    name: "getHunt",
    outputs: [
      {
        components: [
          {
            internalType: "string",
            name: "name",
            type: "string",
          },
          {
            internalType: "string",
            name: "description",
            type: "string",
          },
          {
            internalType: "uint256",
            name: "startTime",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "endTime",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "participantCount",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "clues_blobId",
            type: "string",
          },
          {
            internalType: "string",
            name: "answers_blobId",
            type: "string",
          },
          {
            internalType: "bool",
            name: "teamsEnabled",
            type: "bool",
          },
          {
            internalType: "uint256",
            name: "maxTeamSize",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "theme",
            type: "string",
          },
          {
            internalType: "string",
            name: "nftMetadataURI",
            type: "string",
          },
          {
            internalType: "address[]",
            name: "participants",
            type: "address[]",
          },
        ],
        internalType: "struct Khoj.HuntInfo",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_huntId",
        type: "uint256",
      },
    ],
    name: "getHuntTeamCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_huntId",
        type: "uint256",
      },
    ],
    name: "getHuntTeams",
    outputs: [
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_huntId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "_participant",
        type: "address",
      },
    ],
    name: "getParticipantTeamId",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_huntId",
        type: "uint256",
      },
    ],
    name: "getTeam",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "huntId",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "teamId",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "owner",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "maxMembers",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "memberCount",
            type: "uint256",
          },
          {
            internalType: "address[]",
            name: "members",
            type: "address[]",
          },
        ],
        internalType: "struct Khoj.TeamInfo",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_teamId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "_member",
        type: "address",
      },
    ],
    name: "isTeamMember",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_teamId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_expiry",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "_signature",
        type: "bytes",
      },
    ],
    name: "joinWithInvite",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "nftContract",
    outputs: [
      {
        internalType: "contract KhojNFT",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_huntId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "_recipient",
        type: "address",
      },
    ],
    name: "registerForHunt",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
