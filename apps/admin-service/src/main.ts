import 'dotenv/config';
import express from 'express';
import { clerkMiddleware } from '@clerk/express';
import { errorMiddleware } from '@biashara-mall/error-handler';
import { requireAdmin } from '@biashara-mall/auth';
import { productsRouter } from './routes/products';
import { sellersRouter } from './routes/sellers';
import { usersRouter } from './routes/users';
import { customizationRouter } from './routes/customization';

const app = express();

app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(clerkMiddleware());

app.get('/api', (req, res) => {
  res.send({ message: 'Welcome to admin-service!' });
});

app.use('/api', requireAdmin);
app.use('/api', productsRouter);
app.use('/api', sellersRouter);
app.use('/api', usersRouter);
app.use('/api', customizationRouter);

app.use(errorMiddleware);

const port = process.env.PORT || 6005;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
