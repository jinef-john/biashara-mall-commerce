import { redis } from './client';

const unseenKey = (conversationId: string, userId: string) =>
  `unseen:${conversationId}:${userId}`;

export async function incrementUnseenCount(conversationId: string, userId: string): Promise<number> {
  return redis.incr(unseenKey(conversationId, userId));
}

export async function getUnseenCount(conversationId: string, userId: string): Promise<number> {
  const value = await redis.get(unseenKey(conversationId, userId));
  return value ? Number(value) : 0;
}

export async function clearUnseenCount(conversationId: string, userId: string): Promise<void> {
  await redis.del(unseenKey(conversationId, userId));
}
