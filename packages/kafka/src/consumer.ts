import type { Consumer } from 'kafkajs';

const RESTART_DELAY_MS = 5000;

// The client sets logLevel NOTHING (so sendLog stays quiet against a dead
// broker), which also silences kafkajs's own crash logging. Without this a
// consumer that dies with restart:false leaves its group and stops persisting
// anything, with the process still alive and no signal at all.
export function restartOnCrash(
  consumer: Consumer,
  label: string,
  start: () => Promise<void>,
): void {
  consumer.on(consumer.events.CRASH, async ({ payload }) => {
    console.error(`[${label}] consumer crashed:`, payload.error);
    if (payload.restart) return;

    await consumer.disconnect().catch(() => undefined);
    setTimeout(() => {
      console.error(`[${label}] restarting consumer`);
      start().catch((err) => console.error(`[${label}] restart failed:`, err));
    }, RESTART_DELAY_MS);
  });
}
