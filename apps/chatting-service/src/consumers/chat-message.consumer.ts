import {
  kafka,
  restartOnCrash,
  TOPICS,
  type ChatMessageEvent,
} from '@biashara-mall/kafka';
import { prisma } from '@biashara-mall/prisma';

const BATCH_INTERVAL_MS = 3000;
let buffer: ChatMessageEvent[] = [];
let flushing = false;
let flushTimer: ReturnType<typeof setInterval> | undefined;

const toRow = (m: ChatMessageEvent) => ({
  conversationId: m.conversationId,
  senderId: m.senderId,
  senderType: m.senderType,
  content: m.content,
  attachments: m.attachments,
  createdAt: new Date(m.createdAt),
});

const isDuplicate = (err: unknown) =>
  (err as { code?: string })?.code === 'P2002';

/** The newest message per conversation, which is what the inbox orders by —
 * newest, not last seen, since a batch can arrive out of order. */
export function latestPerConversation(
  batch: ChatMessageEvent[],
): Map<string, string> {
  const latest = new Map<string, string>();
  for (const message of batch) {
    const current = latest.get(message.conversationId);
    if (!current || message.createdAt > current) {
      latest.set(message.conversationId, message.createdAt);
    }
  }
  return latest;
}

// Messages live in their own collection, so nothing else moves the group row
// the inbox orders by.
async function touchConversations(batch: ChatMessageEvent[]) {
  const latest = latestPerConversation(batch);

  await Promise.all(
    [...latest].map(([id, createdAt]) =>
      prisma.conversationGroup
        .update({ where: { id }, data: { updatedAt: new Date(createdAt) } })
        .catch((err) =>
          console.error(
            `[chat-consumer] touch ${id} failed:`,
            (err as Error).message,
          ),
        ),
    ),
  );
}

// createMany has no skipDuplicates on MongoDB, so a re-queued batch would
// collide with the rows that already landed and never drain. P2002 here means
// "already persisted"; anything else is a real failure and goes back on the buffer.
async function flushIndividually(batch: ChatMessageEvent[]) {
  const failed: ChatMessageEvent[] = [];
  let persisted = 0;

  for (const message of batch) {
    try {
      await prisma.message.create({ data: toRow(message) });
      persisted++;
    } catch (err) {
      if (!isDuplicate(err)) failed.push(message);
    }
  }

  if (failed.length) buffer = [...failed, ...buffer];
  await touchConversations(batch.filter((m) => !failed.includes(m)));
  console.log(
    `[chat-consumer] persisted ${persisted}/${batch.length} message(s)` +
      (failed.length ? `, ${failed.length} re-queued` : ''),
  );
}

async function flush() {
  if (flushing || buffer.length === 0) return;
  flushing = true;
  const batch = buffer;
  buffer = [];

  try {
    await prisma.message.createMany({ data: batch.map(toRow) });
    await touchConversations(batch);
    console.log(`[chat-consumer] persisted ${batch.length} message(s)`);
  } catch {
    await flushIndividually(batch);
  } finally {
    flushing = false;
  }
}

export async function startChatMessageConsumer(): Promise<void> {
  const consumer = kafka.consumer({ groupId: 'chat-message-db-writer' });
  restartOnCrash(consumer, 'chat-consumer', startChatMessageConsumer);

  await consumer.connect();
  await consumer.subscribe({
    topic: TOPICS.CHAT_NEW_MESSAGE.topic,
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      try {
        buffer.push(JSON.parse(message.value.toString()) as ChatMessageEvent);
      } catch (err) {
        console.error(
          '[chat-consumer] malformed message:',
          (err as Error).message,
        );
      }
    },
  });

  // Guarded: a crash restart re-enters this function, and a second interval
  // would double-flush the same buffer.
  flushTimer ??= setInterval(flush, BATCH_INTERVAL_MS);
  console.log(
    '[chat-consumer] consumer group "chat-message-db-writer" running',
  );
}
