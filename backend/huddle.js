import { API } from '@huddle01/server-sdk/api';
import { Recorder } from '@huddle01/server-sdk/recorder';
import { AccessToken, Role } from '@huddle01/server-sdk/auth';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
 
const recorder = new Recorder(process.env.HUDDLE_PROJECT_ID, process.env.HUDDLE_API_KEY);

export const getRoomId = async () => {
  const api = new API({
    apiKey: process.env.HUDDLE_API_KEY,
  });
 
  const newRoom = await api.createRoom({
    roomLocked: true,
    metadata: JSON.stringify({
      'title': 'Huddle01 Meeting',
    })
  });
 
  return newRoom.roomId;
};


export async function getToken(roomId) {
    console.log(roomId);
     const accessToken = new AccessToken({
         apiKey: process.env.HUDDLE_API_KEY,
         roomId: roomId,
         //available roles: Role.HOST, Role.CO_HOST, Role.SPEAKER, Role.LISTENER, Role.GUEST - depending on the privileges you want to give to the user
         role: Role.BOT,
         //custom permissions give you more flexibility in terms of the user privileges than a pre-defined role
         permissions: {
               admin: true,
               canConsume: true,
               canProduce: true,
               canProduceSources: {
                 cam: true,
                 mic: true,
                 screen: true,
               },
               canRecvData: true,
               canSendData: true,
               canUpdateMetadata: true,
             }
       });
       console.log(accessToken.toJwt());
       return accessToken.toJwt();
    
 }

 export async function startStreaming(roomId, token, streamUrl, streamKey) {
    await recorder.startLivestream({
        roomId: roomId,
        token: token,
        rtmpUrls: [`${streamUrl}/${streamKey}`] //passing the RTMP URL
    })
 }

 export async function stopStreaming(roomId) {
    await recorder.stop({
        roomId: roomId,
    })
 }
 






