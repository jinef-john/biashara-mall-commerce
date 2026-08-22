import 'dotenv/config';
import http from 'http';
import express from 'express';
import { clerkMiddleware } from '@clerk/express';
import { createErrorMiddleware } from '@biashara-mall/error-handler';
import { sendLog } from '@biashara-mall/kafka';
import { ensureTopics } from '@biashara-mall/kafka';
import { initWebSocket } from './websocket';
import { startChatMessageConsumer } from './consumers/chat-message.consumer';
import { conversationsRouter } from './routes/conversations';

const app = express();

app.use(express.json());
app.use(clerkMiddleware());
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

app.get('/api', (req, res) => {
  res.send({ message: 'Welcome to chatting-service!' });
});

app.use('/api', conversationsRouter);

app.use(createErrorMiddleware('chatting-service'));

const server = http.createServer(app);
initWebSocket(server);

const port = process.env.PORT || 6006;
server.listen(port, async () => {
  console.log(`Listening at http://localhost:${port}/api`);
  void sendLog({ type: 'info', message: `chatting-service started on port ${port}`, source: 'chatting-service' });
  // Before subscribing: a missing topic would otherwise be broker-auto-created
  // with default partitioning instead of the count TOPICS declares.
  await ensureTopics();
  await startChatMessageConsumer();
});
server.on('error', console.error);
