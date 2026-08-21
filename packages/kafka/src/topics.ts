import { kafka } from './client';

// Partition counts: 6 for users-events per the plan (parallel analytics
// consumers keyed by userId later). chat.new.message is keyed by
// conversationId, so 3 partitions gives some parallelism while keeping a
// single conversation's messages in order. logs has one reader (the
// logger-service WS fan-out) and no ordering key, so 1 partition is enough.
export const TOPICS = {
  USERS_EVENTS: { topic: 'users-events', numPartitions: 6 },
  CHAT_NEW_MESSAGE: { topic: 'chat.new.message', numPartitions: 3 },
  LOGS: { topic: 'logs', numPartitions: 1 },
} as const;

/**
 * Idempotent: createTopics() only creates topics that don't already exist
 * and returns which ones it created, so this is safe to call on every boot.
 */
export async function ensureTopics(): Promise<void> {
  const admin = kafka.admin();
  await admin.connect();
  try {
    const existing = await admin.listTopics();
    const toCreate = Object.values(TOPICS).filter((t) => !existing.includes(t.topic));
    if (toCreate.length > 0) {
      await admin.createTopics({ topics: toCreate, waitForLeaders: true });
      console.log(`[kafka] created topics: ${toCreate.map((t) => t.topic).join(', ')}`);
    } else {
      console.log('[kafka] all topics already exist');
    }
  } finally {
    await admin.disconnect();
  }
}
