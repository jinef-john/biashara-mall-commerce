import { kafka, restartOnCrash, TOPICS, type LogEvent } from '@biashara-mall/kafka';
import { broadcast, clientCount } from '../websocket';
import { lokiEnabled, pushToLoki } from '../lib/loki';

const FLUSH_INTERVAL_MS = 3000;
const MAX_BUFFER = 5000;

let buffer: LogEvent[] = [];
let flushing = false;
let flushTimer: ReturnType<typeof setInterval> | undefined;

async function flush() {
  if (flushing || buffer.length === 0) return;
  flushing = true;
  const batch = buffer;
  buffer = [];

  try {
    broadcast(batch);
    await pushToLoki(batch);
  } finally {
    flushing = false;
  }
}

export async function startLogsConsumer(): Promise<void> {
  const consumer = kafka.consumer({ groupId: 'log-events-group' });
  restartOnCrash(consumer, 'logger', startLogsConsumer);

  await consumer.connect();
  await consumer.subscribe({ topic: TOPICS.LOGS.topic, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      try {
        buffer.push(JSON.parse(message.value.toString()) as LogEvent);
        // Logs are the one topic a service can flood; dropping the oldest keeps
        // a burst from growing the buffer without bound.
        if (buffer.length > MAX_BUFFER) buffer = buffer.slice(-MAX_BUFFER);
      } catch (err) {
        console.error('[logger] malformed log event:', (err as Error).message);
      }
    },
  });

  flushTimer ??= setInterval(flush, FLUSH_INTERVAL_MS);
  console.log(
    `[logger] consumer group "log-events-group" running` +
      (lokiEnabled ? ', shipping to Loki' : ', Loki disabled (no LOKI_* env)'),
  );
  console.log(`[logger] ${clientCount()} websocket client(s) connected`);
}
