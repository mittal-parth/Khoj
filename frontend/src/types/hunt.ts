// Hunt type constants matching the smart contract enum (GEO_LOCATION = 0, IMAGE = 1)
export const HUNT_TYPE = {
  GEO_LOCATION: "GEO_LOCATION",
  IMAGE: "IMAGE",
} as const;

export type HuntType = typeof HUNT_TYPE.GEO_LOCATION | typeof HUNT_TYPE.IMAGE;

// Helper function to convert enum value (0 or 1) to HuntType string
export function enumToHuntType(enumValue: number | bigint): HuntType {
  return Number(enumValue) === 1 ? HUNT_TYPE.IMAGE : HUNT_TYPE.GEO_LOCATION;
}

// Helper function to convert HuntType string to enum value (0 or 1)
export function huntTypeToEnum(huntType: HuntType): number {
  return huntType === HUNT_TYPE.IMAGE ? 1 : 0;
}

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
  huntType?: HuntType; // Hunt type: geolocation or image
}

export interface Clue {
  id: number;
  lat?: number; // Optional for image hunts
  long?: number; // Optional for image hunts
  description: string;
  answer: string;
  embedding?: number[]; // For image hunts
  imageFile?: File; // For image hunts - temporary file reference
  imagePreview?: string; // For image hunts - preview URL
}

export interface ClueData {
  id: number;
  description: string;
}

export interface AnswerData {
  id: number;
  answer: string;
  lat?: number; // For geolocation hunts
  long?: number; // For geolocation hunts
  embedding?: number[]; // For image hunts
}

export interface IPFSResponse {
  clues_blobId: string;
  answers_blobId: string;
}

export interface Team {
  huntId: bigint;
  teamId: bigint;
  name: string;
  owner: string;
  maxMembers: bigint;
  memberCount: bigint;
  members?: string[];
}
