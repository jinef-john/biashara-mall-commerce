import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as { redis?: Redis };

// lazyConnect: constructing the client must not throw or block when Redis
// isn't reachable yet. The first real command triggers the connection instead.
export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
  });

redis.on('error', (err) => {
  console.error('[redis] connection error:', err.message);
});

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

export { Redis };
