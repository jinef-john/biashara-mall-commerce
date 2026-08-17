import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';
import { errorMiddleware } from '@biashara-mall/error-handler';
import { webhooksRouter } from './routes/webhooks';

const app = express();

app.use(cors());
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// Mounted before express.json() and before clerkMiddleware(): the handler needs
// the raw body for signature verification, and Clerk signs these requests
// rather than authenticating them with a session.
app.use('/api/webhooks', webhooksRouter);

app.use(express.json());
app.use(clerkMiddleware());

app.get('/api', (req, res) => {
  res.send({ message: 'Welcome to user-service!' });
});

app.use(errorMiddleware);

const port = process.env.PORT || 6001;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
