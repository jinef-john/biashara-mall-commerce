import 'dotenv/config';
import express from 'express';
import { clerkMiddleware } from '@clerk/express';
import { createErrorMiddleware } from '@biashara-mall/error-handler';
import { sendLog } from '@biashara-mall/kafka';
import { categoriesRouter } from './routes/categories';
import { productsRouter } from './routes/products';
import { discountCodesRouter } from './routes/discount-codes';
import { siteConfigRouter } from './routes/site-config';
import { publicRouter } from './routes/public';
import { initializeConfig } from './lib/init-config';
import './jobs/product-purge.job';

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(clerkMiddleware());
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

app.get('/api', (req, res) => {
  res.send({ message: 'Welcome to product-service!' });
});

app.use('/api/get-categories', categoriesRouter);
app.use('/api/site-config', siteConfigRouter);
app.use('/api/products', productsRouter);
app.use('/api/discount-codes', discountCodesRouter);
app.use('/api', publicRouter);

app.use(createErrorMiddleware('product-service'));

const port = process.env.PORT || 6002;
const server = app.listen(port, async () => {
  await initializeConfig();
  console.log(`Listening at http://localhost:${port}/api`);
  void sendLog({ type: 'info', message: `product-service started on port ${port}`, source: 'product-service' });
});
server.on('error', console.error);
