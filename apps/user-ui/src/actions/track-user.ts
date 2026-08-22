'use server';

import { produce, TOPICS, type UserEvent } from '@biashara-mall/kafka';

// Best-effort: never throws back to the caller, so a dropped analytics
// event can't surface as a broken add-to-cart click.
export async function trackUserEvent(event: Omit<UserEvent, 'timestamp'>): Promise<void> {
  try {
    await produce(TOPICS.USERS_EVENTS.topic, [
      {
        key: event.clerkId,
        value: JSON.stringify({ ...event, timestamp: new Date().toISOString() }),
      },
    ]);
  } catch (err) {
    console.error('[track-user] failed to produce event:', (err as Error).message);
  }
}
