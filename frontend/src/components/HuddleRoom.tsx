import { FC, useEffect, useState } from "react";
import { useRoom } from "@huddle01/react/hooks";
import { HuddleVideo } from "./HuddleVideo";
import { Button } from "./ui/button";
import { FaYoutube } from "react-icons/fa";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HuddleRoomConfig, HuddleRoomProps } from "../types";


const BACKEND_URL = import.meta.env.VITE_PUBLIC_BACKEND_URL;

export const HuddleRoom: FC<HuddleRoomProps> = ({ huntId, teamIdentifier }) => {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isVideoMinimized, setIsVideoMinimized] = useState(false);
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [streamKey, setStreamKey] = useState("");
  const [streamUrl, setStreamUrl] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  
  // Don't show huddle if user is not in a team (teamIdentifier starts with 0x)
  const shouldShowHuddle = teamIdentifier && !teamIdentifier.startsWith("0x");

  const { joinRoom, leaveRoom } = useRoom({
    onJoin: () => {
      console.info("Huddle room joined");
      setHasJoinedRoom(true);
      setIsJoining(false);
    },
    onLeave: () => {
      console.info("Huddle room left");
      setHasJoinedRoom(false);
    },
  });

  useEffect(() => {
    const initializeRoom = async () => {
      try {
        // Only initialize if user should have access to huddle
        if (!shouldShowHuddle) {
          return;
        }
        
        const storedConfig = localStorage.getItem(`huntId_${huntId}_team_${teamIdentifier}`);
        const huddleRoomConfig: HuddleRoomConfig | null = storedConfig
          ? JSON.parse(storedConfig)
          : null;

        if (huddleRoomConfig === null) {
          const response = await fetch(`${BACKEND_URL}/huddles`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ 
              huntId: huntId,
              teamId: teamIdentifier 
            }),
            cache: "no-cache",
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          const roomId = data.roomId;
          const token = data.token;
          const huddleRoomConfig = JSON.stringify({ roomId, token });
          localStorage.setItem(`huntId_${huntId}_team_${teamIdentifier}`, huddleRoomConfig);

          setRoomId(roomId);
          setToken(token);
        } else {
          setRoomId(huddleRoomConfig.roomId);
          setToken(huddleRoomConfig.token);
        }
      } catch (error) {
        console.error("Error creating/joining Huddle room:", (error as Error)?.message);
      }
    };

    initializeRoom();

    return () => {
      leaveRoom();
      setHasJoinedRoom(false);
    };
  }, [huntId, teamIdentifier, shouldShowHuddle, leaveRoom]);

  const handleStreamStop = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/huddles/livestreams/${roomId || ""}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await response.json();
      console.info("Streaming stopped");
      setIsStreaming(false);
    } catch (error) {
      console.error("Error stopping stream:", error);
    }
  };

  const handleStreamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Start streaming
      const response = await fetch(`${BACKEND_URL}/huddles/livestreams`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId: roomId,
          token: token,
          streamUrl: streamUrl,
          streamKey: streamKey,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await response.json();
      console.info("Streaming started");
      setIsStreaming(true);
      setIsDrawerOpen(false);
      setStreamKey("");
      setStreamUrl("");
    } catch (error) {
      console.error("Error starting stream:", (error as Error)?.message);
    }
  };

  // Don't render anything if user shouldn't see huddle
  if (!shouldShowHuddle) {
    return null;
  }

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
                  token: token || "",
                });
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 font-medium"
              size="lg"
              disabled={isJoining}
            >
              {isJoining ? "Joining Room..." : "Join Huddle Room"}
            </Button>
          ) : (
            <div className="flex gap-2">
              {!isStreaming ? (
                <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                  <DrawerTrigger asChild>
                    <Button
                      size="lg"
                      className="flex-1 bg-red text-white rounded-lg py-2 font-medium px-4"
                    >
                      <FaYoutube className="mr-2 h-5 w-5" />
                      Stream to YouTube
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <div className="mx-auto w-full max-w-sm">
                      <DrawerHeader>
                        <DrawerTitle>YouTube Stream Settings</DrawerTitle>
                        <DrawerDescription>
                          Enter your YouTube streaming credentials
                        </DrawerDescription>
                      </DrawerHeader>

                      <form
                        onSubmit={handleStreamSubmit}
                        className="p-4 space-y-4"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="streamKey">Stream API Key</Label>
                          <Input
                            id="streamKey"
                            type="password"
                            value={streamKey}
                            onChange={(e) => setStreamKey(e.target.value)}
                            placeholder="Enter your stream key"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="streamUrl">Stream URL</Label>
                          <Input
                            id="streamUrl"
                            type="text"
                            value={streamUrl}
                            onChange={(e) => setStreamUrl(e.target.value)}
                            placeholder="rtmp://..."
                            required
                          />
                        </div>

                        <DrawerFooter>
                          <Button
                            type="submit"
                            className="w-full bg-red text-white rounded-lg py-2 font-medium"
                            onClick={handleStreamSubmit}
                          >
                            <FaYoutube className=" h-5 w-5" />
                            Start Streaming
                          </Button>
                          <DrawerClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DrawerClose>
                        </DrawerFooter>
                      </form>
                    </div>
                  </DrawerContent>
                </Drawer>
              ) : (
                <Button
                  size="lg"
                  className="flex-1 bg-red text-white rounded-lg py-2 font-medium px-4"
                  onClick={handleStreamStop}
                >
                  <FaYoutube className="mr-2 h-5 w-5" />
                  Stop Streaming
                </Button>
              )}

              <Button
                onClick={() => {
                  leaveRoom();
                }}
                size="lg"
                className="bg-gray-600 hover:bg-gray-700 text-white rounded-lg py-2 font-medium px-4"
              >
                Leave Room
              </Button>
            </div>
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
