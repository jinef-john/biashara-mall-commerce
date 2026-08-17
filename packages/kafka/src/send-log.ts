import { kafka } from './client';

export type LogType = 'error' | 'success' | 'warning' | 'info' | 'debug';

export interface LogEvent {
  type: LogType;
  message: string;
  source: string;
  timestamp: string;
}

let producer: ReturnType<typeof kafka.producer> | undefined;
let connecting: Promise<void> | undefined;

async function getProducer() {
  if (!producer) producer = kafka.producer();
  if (!connecting) connecting = producer.connect();
  await connecting;
  return producer;
}

/**
 * Fire-and-forget log event for apps/logger-service (Phase 9) to stream to
 * the admin dashboard. Never throws — a broker outage must not break the
 * request that's being logged.
 */
export async function sendLog(event: Omit<LogEvent, 'timestamp'>): Promise<void> {
  try {
    const p = await getProducer();
    await p.send({
      topic: 'logs',
      messages: [
        { value: JSON.stringify({ ...event, timestamp: new Date().toISOString() }) },
      ],
    });
  } catch (err) {
    console.error('[kafka] sendLog failed:', (err as Error).message);
  }
}
