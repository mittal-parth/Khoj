export interface Hunt {
  name: string;
  description: string;
  startTime: bigint;
  endTime: bigint;
  participantCount: bigint;
  clues_blobId: string;
  answers_blobId: string;
  teamsEnabled: boolean;
  maxTeamSize: bigint;
  theme: string;
  nftMetadataURI: string;
  participants?: string[]; // Array of participant addresses (optional for backward compatibility)
}

export interface Clue {
  id: number;
  lat: number;
  long: number;
  description: string;
  answer: string;
}

export interface ClueData {
  id: number;
  description: string;
}

export interface AnswerData {
  id: number;
  answer: string;
  lat: number;
  long: number;
}

export interface IPFSResponse {
  clues_blobId: string;
  answers_blobId: string;
}

export interface Team {
  huntId: bigint;
  teamId: bigint;
  owner: string;
  maxMembers: bigint;
  memberCount: bigint;
  members?: string[];
}
