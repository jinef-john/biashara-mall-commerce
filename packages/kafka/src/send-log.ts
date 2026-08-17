import { kafka } from './client';

export type LogType = 'error' | 'success' | 'warning' | 'info' | 'debug';

export interface LogEvent {
  type: LogType;
  message: string;
  source: string;
  timestamp: string;
}

const SEND_TIMEOUT_MS = 3000;

let producer: ReturnType<typeof kafka.producer> | undefined;
let connecting: Promise<void> | undefined;

async function getProducer() {
  if (!producer) producer = kafka.producer();
  if (!connecting) connecting = producer.connect();
  await connecting;
  return producer;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms),
    ),
  ]);
}

/**
 * Fire-and-forget log event for apps/logger-service (Phase 9) to stream to
 * the admin dashboard. Bounded to SEND_TIMEOUT_MS and never throws — a broker
 * outage must not add latency to, or fail, the request being logged.
 */
export async function sendLog(event: Omit<LogEvent, 'timestamp'>): Promise<void> {
  try {
    const p = await withTimeout(getProducer(), SEND_TIMEOUT_MS);
    await withTimeout(
      p.send({
        topic: 'logs',
        messages: [
          { value: JSON.stringify({ ...event, timestamp: new Date().toISOString() }) },
        ],
      }),
      SEND_TIMEOUT_MS,
    );
  } catch (err) {
    console.error('[kafka] sendLog failed:', (err as Error).message);
    // Drop the cached producer/connection so the next call retries cleanly
    // instead of reusing one stuck mid-connect.
    producer = undefined;
    connecting = undefined;
  }
}
