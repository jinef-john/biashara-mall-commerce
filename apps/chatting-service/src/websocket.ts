import type { Server } from 'http';
import { WebSocketServer, type WebSocket } from 'ws';
import { redis } from '@biashara-mall/redis';

const PRESENCE_TTL_SECONDS = 300;
const HANDSHAKE_PATTERN = /^(user|seller)_(.+)$/;

// Handshake key -> socket, e.g. "user_<User.id>" / "seller_<Shops.id>".
export const connectedUsers = new Map<string, WebSocket>();

function presenceKey(kind: 'user' | 'seller', id: string) {
  return kind === 'seller' ? `online:shop:${id}` : `online:user:${id}`;
}

export function initWebSocket(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    let handshake: { key: string; kind: 'user' | 'seller'; id: string } | null = null;

    ws.once('message', async (raw) => {
      const match = HANDSHAKE_PATTERN.exec(raw.toString());
      if (!match) {
        ws.close();
        return;
      }

      const kind = match[1] as 'user' | 'seller';
      const id = match[2];
      handshake = { key: `${kind}_${id}`, kind, id };
      connectedUsers.set(handshake.key, ws);
      await redis.set(presenceKey(kind, id), '1', 'EX', PRESENCE_TTL_SECONDS);
    });

    ws.on('close', () => {
      if (!handshake) return;
      connectedUsers.delete(handshake.key);
      redis.del(presenceKey(handshake.kind, handshake.id)).catch(() => undefined);
    });
  });

  return wss;
}
