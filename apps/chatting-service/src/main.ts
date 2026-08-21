import 'dotenv/config';
import http from 'http';
import express from 'express';
import { clerkMiddleware } from '@clerk/express';
import { errorMiddleware } from '@biashara-mall/error-handler';
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

app.use(errorMiddleware);

const server = http.createServer(app);
initWebSocket(server);

const port = process.env.PORT || 6006;
server.listen(port, async () => {
  console.log(`Listening at http://localhost:${port}/api`);
  // Before subscribing: a missing topic would otherwise be broker-auto-created
  // with default partitioning instead of the count TOPICS declares.
  await ensureTopics();
  await startChatMessageConsumer();
});
server.on('error', console.error);
