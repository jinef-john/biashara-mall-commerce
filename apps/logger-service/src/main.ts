import 'dotenv/config';
import http from 'http';
import express from 'express';
import { createErrorMiddleware } from '@biashara-mall/error-handler';
import { ensureTopics, sendLog } from '@biashara-mall/kafka';
import { initWebSocket } from './websocket';
import { startLogsConsumer } from './consumers/logs.consumer';

const app = express();

app.use(express.json());

app.get('/api', (req, res) => {
  res.send({ message: 'Welcome to logger-service!' });
});

app.use(createErrorMiddleware('logger-service'));

const server = http.createServer(app);
initWebSocket(server);

const port = process.env.PORT || 6008;
server.listen(port, async () => {
  console.log(`Listening at http://localhost:${port}/api`);
  await ensureTopics();
  await startLogsConsumer();
  void sendLog({
    type: 'info',
    message: `logger-service started on port ${port}`,
    source: 'logger-service',
  });
});
server.on('error', console.error);
