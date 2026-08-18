import { Kafka, logLevel, type KafkaConfig } from 'kafkajs';

const globalForKafka = globalThis as unknown as { kafka?: Kafka };

// SASL only when both credentials are set: Redpanda (local, Phase 0.7) needs
// none; Confluent Cloud (production) requires ssl + sasl.
function buildConfig(): KafkaConfig {
  const brokers = (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(',');
  const apiKey = process.env.KAFKA_API_KEY;
  const apiSecret = process.env.KAFKA_API_SECRET;

  return {
    clientId: 'biashara-mall',
    brokers,
    logLevel: logLevel.NOTHING,
    connectionTimeout: 2000,
    // Bounded, unlike kafkajs's default (effectively unbounded retries):
    // a broker outage must fail sendLog fast, never hang the caller.
    retry: { retries: 2, initialRetryTime: 300, maxRetryTime: 2000 },
    ...(apiKey && apiSecret
      ? {
          ssl: true,
          sasl: { mechanism: 'plain', username: apiKey, password: apiSecret },
        }
      : {}),
  };
}

export const kafka = globalForKafka.kafka ?? new Kafka(buildConfig());

if (process.env.NODE_ENV !== 'production') {
  globalForKafka.kafka = kafka;
}
