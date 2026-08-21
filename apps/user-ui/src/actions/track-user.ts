'use server';

import { kafka, TOPICS, type UserEvent } from '@biashara-mall/kafka';

/**
 * Best-effort: never throws back to the caller. A dropped analytics event
 * must not surface as a broken add-to-cart click. Connects and disconnects
 * per call, unlike sendLog's pooled producer — this runs from a Next.js
 * server action, not a long-lived Express process.
 */
export async function trackUserEvent(event: Omit<UserEvent, 'timestamp'>): Promise<void> {
  const producer = kafka.producer();
  try {
    await producer.connect();
    await producer.send({
      topic: TOPICS.USERS_EVENTS.topic,
      messages: [
        {
          key: event.clerkId,
          value: JSON.stringify({ ...event, timestamp: new Date().toISOString() }),
        },
      ],
    });
  } catch (err) {
    console.error('[track-user] failed to produce event:', (err as Error).message);
  } finally {
    await producer.disconnect();
  }
}
