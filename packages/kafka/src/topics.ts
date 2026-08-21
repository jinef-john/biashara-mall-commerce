import { kafka } from './client';

// chat.new.message is keyed by conversationId (partitioned for parallelism,
// ordered per conversation); logs has a single WS-fan-out reader, so 1 is enough.
export const TOPICS = {
  USERS_EVENTS: { topic: 'users-events', numPartitions: 6 },
  CHAT_NEW_MESSAGE: { topic: 'chat.new.message', numPartitions: 3 },
  LOGS: { topic: 'logs', numPartitions: 1 },
} as const;

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
