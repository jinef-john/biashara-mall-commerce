import 'dotenv/config';
import express from 'express';
import { clerkMiddleware } from '@clerk/express';
import { createErrorMiddleware } from '@biashara-mall/error-handler';
import { sendLog } from '@biashara-mall/kafka';
import { webhookRouter } from './routes/webhook';
import { paymentRouter } from './routes/payment';
import { ordersRouter } from './routes/orders';

const app = express();

app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// Mounted before express.json() and before clerkMiddleware(): Stripe signs
// this request rather than authenticating it with a session. The route
// itself applies express.raw() (see routes/webhook.ts). Doing it here would
// consume the body stream for every /api/* request, not just this one.
app.use('/api', webhookRouter);

app.use(express.json());
app.use(clerkMiddleware());

app.get('/api', (req, res) => {
  res.send({ message: 'Welcome to order-service!' });
});

app.use('/api', paymentRouter);
app.use('/api', ordersRouter);

app.use(createErrorMiddleware('order-service'));

const port = process.env.PORT || 6004;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
  void sendLog({ type: 'info', message: `order-service started on port ${port}`, source: 'order-service' });
});
server.on('error', console.error);
