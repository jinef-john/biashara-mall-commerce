import 'dotenv/config';
import { ensureTopics } from '@biashara-mall/kafka';
import { startUserEventsConsumer } from './consumers/user-events.consumer';

async function bootstrap() {
  await ensureTopics();
  await startUserEventsConsumer();
}

bootstrap().catch((err) => {
  console.error('[kafka-service] bootstrap failed:', err);
  process.exit(1);
});
