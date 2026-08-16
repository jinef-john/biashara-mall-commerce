import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';
import { categoriesRouter } from './routes/categories';
import { initializeConfig } from './lib/init-config';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(clerkMiddleware());

app.get('/api', (req, res) => {
  res.send({ message: 'Welcome to product-service!' });
});

app.use('/api/get-categories', categoriesRouter);

const port = process.env.PORT || 6002;
const server = app.listen(port, async () => {
  await initializeConfig();
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
