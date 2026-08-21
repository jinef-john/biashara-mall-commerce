import 'dotenv/config';
import http from 'http';
import express from 'express';
import { clerkMiddleware } from '@clerk/express';
import { errorMiddleware } from '@biashara-mall/error-handler';
import { initWebSocket } from './websocket';

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

app.use(errorMiddleware);

const server = http.createServer(app);
initWebSocket(server);

const port = process.env.PORT || 6006;
server.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
