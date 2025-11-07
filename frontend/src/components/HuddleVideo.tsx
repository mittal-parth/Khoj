import { FC, useEffect, useRef } from 'react';
import {
  useLocalVideo,
  useLocalAudio,
  useLocalScreenShare,
  usePeerIds,
  useRemoteVideo,
  useRemoteAudio,
  useRemoteScreenShare,
} from "@huddle01/react/hooks";
import { Audio, Video } from '@huddle01/react/components';
import { Button } from "./ui/button";
import { BsCameraVideo, BsCameraVideoOff, BsMic, BsMicMute, BsDisplay } from "react-icons/bs";
import { HuddleVideoProps, RemotePeerProps } from "../types";


export const HuddleVideo: FC<HuddleVideoProps> = ({ minimized = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const { stream: localVideo, enableVideo, disableVideo, isVideoOn } = useLocalVideo();
  const { enableAudio, disableAudio, isAudioOn } = useLocalAudio();
  const { startScreenShare, stopScreenShare, shareStream } = useLocalScreenShare();
  const { peerIds } = usePeerIds({ roles: ["host", "guest"] });

  useEffect(() => {
    if (localVideo && videoRef.current) {
      videoRef.current.srcObject = localVideo;
    }
  }, [localVideo]);

  const togglePiP = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (videoRef.current) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (error) {
      console.error('PiP failed:', error);
    }
  };

  return (
    <div className={`${minimized ? 'fixed bottom-4 right-4 w-72' : 'w-full'} 
                    bg-black rounded-lg overflow-hidden shadow-xl transition-all duration-300`}>
      <div className="relative">
        {/* Local Video */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full aspect-video bg-gray-900"
        />

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-linear-to-t from-black/80 to-transparent">
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={() => isVideoOn ? disableVideo() : enableVideo()}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
            >
              {isVideoOn ? <BsCameraVideo /> : <BsCameraVideoOff />}
            </Button>

            <Button
              onClick={() => isAudioOn ? disableAudio() : enableAudio()}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
            >
              {isAudioOn ? <BsMic /> : <BsMicMute />}
            </Button>

            <Button
              onClick={() => shareStream ? stopScreenShare() : startScreenShare()}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
            >
              <BsDisplay />
            </Button>

            <Button
              onClick={togglePiP}
              variant="ghost"
              className="text-white hover:bg-white/20"
            >
              PiP
            </Button>
          </div>
        </div>
      </div>

      {/* Remote Peers */}
      <div className="grid grid-cols-2 gap-2 p-2">
        {peerIds.map((peerId) => (
          <RemotePeer key={peerId} peerId={peerId} />
        ))}
      </div>
    </div>
  );
};


const RemotePeer: FC<RemotePeerProps> = ({ peerId }) => {
  const { stream: videoStream } = useRemoteVideo({ peerId });
  const { stream: audioStream } = useRemoteAudio({ peerId });
  const { videoStream: screenVideoStream, audioStream: screenAudioStream } = useRemoteScreenShare({ peerId });

  return (
    <div className="aspect-video bg-gray-800 rounded-sm overflow-hidden">
      {videoStream && <Video stream={videoStream} />}
      {audioStream && <Audio stream={audioStream} />}
      {screenVideoStream && <Video stream={screenVideoStream} />}
      {screenAudioStream && <Audio stream={screenAudioStream} />}
    </div>
  );
}; 