export interface HuddleVideoProps {
  minimized?: boolean;
  onToggleMinimize?: () => void;
}

export interface HuddleRoomConfig {
  roomId: string;
  token: string;
}

export interface HuddleRoomProps {
  huntId: string;
  teamIdentifier?: string;
}

export interface RemotePeerProps {
  peerId: string;
}
