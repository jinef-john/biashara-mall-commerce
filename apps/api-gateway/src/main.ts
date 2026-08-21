import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { errorMiddleware } from '@biashara-mall/error-handler';

const app = express();

// Behind ngrok/a reverse proxy in dev and prod: trust the first hop so
// req.ip (rate-limit key) reflects the real client, not the proxy.
app.set('trust proxy', 1);

app.use(morgan('dev'));

app.use(
  cors({
    origin: [
      process.env.USER_UI_URL ?? 'http://localhost:3000',
      process.env.SELLER_UI_URL ?? 'http://localhost:3001',
      process.env.ADMIN_UI_URL ?? 'http://localhost:3002',
    ],
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type'],
  }),
);

// NOTE: no express.json() here on purpose: bodies must stream through
// untouched (ImageKit base64 uploads, signed webhook payloads).

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  // Signed-in clients get a higher ceiling. The token isn't verified here
  // (services do that), so this only tiers abuse protection, not access.
  // Anonymous storefront browsing is legitimately chatty (a single product
  // page fans out to several reads), so it gets its own tier above 100.
  limit: (req) =>
    req.headers.authorization ? 1000 : req.method === 'GET' ? 600 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Too many requests, please try again later' },
  // Health probes and Clerk webhook retries must never be throttled.
  skip: (req) =>
    req.path === '/health' || req.path.startsWith('/user/api/webhooks'),
});
app.use(limiter);

interface ServiceDef {
  target: string;
  implemented: boolean;
}

const services: Record<string, ServiceDef> = {
  '/user': {
    target: process.env.USER_SERVICE_URL ?? 'http://localhost:6001',
    implemented: true,
  },
  '/product': {
    target: process.env.PRODUCT_SERVICE_URL ?? 'http://localhost:6002',
    implemented: true,
  },
  '/seller': {
    target: process.env.SELLER_SERVICE_URL ?? 'http://localhost:6003',
    implemented: true,
  },
  '/order': {
    target: process.env.ORDER_SERVICE_URL ?? 'http://localhost:6004',
    implemented: true,
  },
  '/admin': {
    target: process.env.ADMIN_SERVICE_URL ?? 'http://localhost:6005',
    implemented: true,
  },
  '/chatting': {
    target: process.env.CHATTING_SERVICE_URL ?? 'http://localhost:6006',
    implemented: true,
  },
  '/recommendation': {
    target: process.env.RECOMMENDATION_SERVICE_URL ?? 'http://localhost:6007',
    implemented: false,
  },
};

app.get('/health', async (req, res) => {
  const checks = await Promise.all(
    Object.entries(services)
      .filter(([, s]) => s.implemented)
      .map(async ([prefix, s]) => {
        try {
          const r = await fetch(`${s.target}/api`, {
            signal: AbortSignal.timeout(2000),
          });
          return { service: prefix.slice(1), status: r.ok ? 'up' : 'degraded' };
        } catch {
          return { service: prefix.slice(1), status: 'down' };
        }
      }),
  );

  const allUp = checks.every((c) => c.status === 'up');
  res.status(allUp ? 200 : 503).json({
    status: allUp ? 'ok' : 'degraded',
    gateway: 'up',
    services: checks,
  });
});

app.get('/api', (req, res) => {
  res.send({ message: 'Welcome to api-gateway!' });
});

for (const [prefix, { target }] of Object.entries(services)) {
  app.use(prefix, createProxyMiddleware({ target, changeOrigin: true }));
}

app.use(errorMiddleware);

const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
