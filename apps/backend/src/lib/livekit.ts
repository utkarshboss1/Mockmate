// ============================================================
// livekit.ts — LiveKit Server Access Token Helper
//
// WHY: Wraps the third-party LiveKit Server SDK behind an isolated
// helper function so business logic does not leak LiveKit internals.
// ============================================================

import { AccessToken } from 'livekit-server-sdk';
import { env } from '../config/env';

export async function generateLiveKitToken(params: {
  roomName: string;
  identity: string;
  name: string;
}): Promise<string> {
  const at = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
    identity: params.identity,
    name: params.name,
    ttl: '2h', // 2-hour token lifespan
  });

  at.addGrant({
    roomJoin: true,
    room: params.roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  return at.toJwt();
}
