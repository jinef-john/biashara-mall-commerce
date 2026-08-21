import 'dotenv/config';
import express from 'express';
import { clerkMiddleware } from '@clerk/express';
import { errorMiddleware } from '@biashara-mall/error-handler';
import { shopsRouter } from './routes/shops';
import { publicShopsRouter } from './routes/public';
import { followRouter } from './routes/follow';
import { notificationsRouter } from './routes/notifications';

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(clerkMiddleware());
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

app.get('/api', (req, res) => {
  res.send({ message: 'Welcome to seller-service!' });
});

app.use('/api/shops', shopsRouter);
app.use('/api', publicShopsRouter);
app.use('/api', followRouter);
app.use('/api/seller-notifications', notificationsRouter);

app.use(errorMiddleware);

const port = process.env.PORT || 6003;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
