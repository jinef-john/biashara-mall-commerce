import type { Message } from 'kafkajs';
import { kafka } from './client';

let producer: ReturnType<typeof kafka.producer> | undefined;
let connecting: Promise<void> | undefined;

// Pooled for long-lived services. Rethrows, unlike sendLog's fire-and-forget
// wrapper: the topic is the only path to persistence, so callers must know.
export async function produce(topic: string, messages: Message[]): Promise<void> {
  try {
    if (!producer) producer = kafka.producer();
    if (!connecting) connecting = producer.connect();
    await connecting;
    await producer.send({ topic, messages });
  } catch (err) {
    producer = undefined;
    connecting = undefined;
    throw err;
  }
}
