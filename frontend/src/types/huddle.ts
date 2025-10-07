export interface HuddleVideoProps {
  minimized?: boolean;
  onToggleMinimize?: () => void;
}

export interface HuddleRoomConfig {
  roomId: string;
  token: string;
  teamId?: string;
}

export interface HuddleRoomProps {
  huntId: string;
  teamId?: string;
}

export interface RemotePeerProps {
  peerId: string;
}
