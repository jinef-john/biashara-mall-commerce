import 'dotenv/config';
import { ensureTopics } from '@biashara-mall/kafka';

async function bootstrap() {
  await ensureTopics();
  console.log('[kafka-service] topics ready — no consumers registered yet');
}

bootstrap().catch((err) => {
  console.error('[kafka-service] bootstrap failed:', err);
  process.exit(1);
});
