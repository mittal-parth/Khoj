import { FC, useEffect, useState } from 'react';
import { useRoom } from '@huddle01/react/hooks';
import { HuddleVideo } from './HuddleVideo';
import { Button } from './ui/button';

interface HuddleRoomConfig {
  roomId: string;
  token: string;
}

interface HuddleRoomProps {
  huntId: string;
}

export const HuddleRoom: FC<HuddleRoomProps> = ({ huntId }) => {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isVideoMinimized, setIsVideoMinimized] = useState(false);
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const { joinRoom, leaveRoom } = useRoom({
    onJoin: () => {
      console.log('Joined the room');
      setHasJoinedRoom(true);
      setIsJoining(false);
    },
    onLeave: () => {
      console.log('Left the room');
      setHasJoinedRoom(false);
    },
  });

  useEffect(() => {
    const initializeRoom = async () => {
      try {
        const huddleRoomConfig: HuddleRoomConfig = JSON.parse(
          localStorage.getItem(`huntId_${huntId}`) || ""
        );

        if (huddleRoomConfig === null) {
          const response = await fetch("http://localhost:8000/startHuddle", {
            method: "POST",
            headers: {
              'Content-Type': 'application/json'
            },
            cache: "no-cache",
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          const roomId = data.roomId;
          const token = data.token;
          const huddleRoomConfig = JSON.stringify({ roomId, token });
          localStorage.setItem(`huntId_${huntId}`, huddleRoomConfig);

          setRoomId(roomId);
          setToken(token);
        } else {
          setRoomId(huddleRoomConfig.roomId);
          setToken(huddleRoomConfig.token);
        }
      } catch (error) {
        console.error("Error creating/joining Huddle room:", error);
      }
    };

    initializeRoom();

    return () => {
      leaveRoom();
      setHasJoinedRoom(false);
    };
  }, [huntId, leaveRoom]);

  return (
    <div className="bottom-4 right-4 z-50 w-full max-w-md mx-auto">
      <div className="flex flex-col gap-2">
        <div className="w-full">
          {!hasJoinedRoom ? (
            <Button
              onClick={() => {
                setIsJoining(true);
                joinRoom({
                  roomId: roomId || "",
                  token: token || ""
                });
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 font-medium"
              size="lg"
              disabled={isJoining}
            >
              {isJoining ? "Joining Room..." : "Join Huddle Room"}
            </Button>
          ) : (
            <Button
              onClick={() => {
                leaveRoom();
              }}
              size="lg"
              className="w-full bg-red hover:bg-gray-600 rounded-lg py-2 font-medium"
            >
              Leave Room
            </Button>
          )}
        </div>

        {hasJoinedRoom && roomId && token && (
          <HuddleVideo 
            minimized={isVideoMinimized}
            onToggleMinimize={() => setIsVideoMinimized(!isVideoMinimized)}
          />
        )}
      </div>
    </div>
  );
}; 