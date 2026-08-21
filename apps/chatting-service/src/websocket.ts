import type { Server } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { redis, clearUnseenCount, incrementUnseenCount } from '@biashara-mall/redis';
import { TOPICS, produce, type ChatMessageEvent, type SenderKind } from '@biashara-mall/kafka';

const PRESENCE_TTL_SECONDS = 300;
const HANDSHAKE_PATTERN = /^(user|seller)_(.+)$/;

// Keyed "user_<User.id>" / "seller_<Shops.id>".
export const connectedUsers = new Map<string, WebSocket>();

interface Handshake {
  key: string;
  kind: SenderKind;
  id: string;
}

interface IncomingMessage {
  type?: string;
  conversationId?: string;
  fromUserId?: string;
  toUserId?: string;
  messageBody?: string;
  senderType?: SenderKind;
  attachments?: string[];
}

function presenceKey(kind: SenderKind, id: string) {
  return kind === 'seller' ? `online:shop:${id}` : `online:user:${id}`;
}

function receiverKey(senderType: SenderKind, toUserId: string) {
  return senderType === 'user' ? `seller_${toUserId}` : `user_${toUserId}`;
}

function send(socket: WebSocket | undefined, payload: unknown) {
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(payload));
}

async function handleChatMessage(handshake: Handshake, data: IncomingMessage) {
  const { conversationId, toUserId, messageBody } = data;
  const senderType = data.senderType ?? handshake.kind;
  if (!conversationId || !toUserId || !messageBody) return;

  const createdAt = new Date().toISOString();
  const message = {
    conversationId,
    senderId: handshake.id,
    senderType,
    content: messageBody,
    attachments: data.attachments ?? [],
    createdAt,
  } satisfies ChatMessageEvent;

  const unseenCount = await incrementUnseenCount(conversationId, toUserId);
  const receiver = connectedUsers.get(receiverKey(senderType, toUserId));

  send(receiver, { type: 'NEW_MESSAGE', message });
  send(receiver, { type: 'UNSEEN_COUNT_UPDATE', conversationId, count: unseenCount });
  // Echoed so the sender's own message takes the same path as an incoming one;
  // the client must not render optimistically or it double-renders.
  send(connectedUsers.get(handshake.key), { type: 'NEW_MESSAGE', message });

  // After delivery: producing first would stall the socket on a broker round-trip.
  await produce(TOPICS.CHAT_NEW_MESSAGE.topic, [
    { key: conversationId, value: JSON.stringify(message) },
  ]);
}

async function handleMarkAsSeen(handshake: Handshake, data: IncomingMessage) {
  if (!data.conversationId) return;
  await clearUnseenCount(data.conversationId, handshake.id);
  send(connectedUsers.get(handshake.key), {
    type: 'UNSEEN_COUNT_UPDATE',
    conversationId: data.conversationId,
    count: 0,
  });
}

export function initWebSocket(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    let handshake: Handshake | null = null;

    ws.on('message', async (raw) => {
      const text = raw.toString();

      if (!handshake) {
        const match = HANDSHAKE_PATTERN.exec(text);
        if (!match) {
          ws.close();
          return;
        }
        const kind = match[1] as SenderKind;
        const id = match[2];
        handshake = { key: `${kind}_${id}`, kind, id };
        connectedUsers.set(handshake.key, ws);
        await redis.set(presenceKey(kind, id), '1', 'EX', PRESENCE_TTL_SECONDS);
        return;
      }

      let data: IncomingMessage;
      try {
        data = JSON.parse(text);
      } catch {
        return;
      }

      try {
        if (data.type === 'MARK_AS_SEEN') await handleMarkAsSeen(handshake, data);
        else await handleChatMessage(handshake, data);
      } catch (err) {
        console.error('[chat] failed to handle message:', (err as Error).message);
      }
    });

    ws.on('close', () => {
      if (!handshake) return;
      connectedUsers.delete(handshake.key);
      redis.del(presenceKey(handshake.kind, handshake.id)).catch(() => undefined);
    });
  });

  return wss;
}
