import 'dotenv/config';
import express from 'express';
import { clerkMiddleware } from '@clerk/express';
import { createErrorMiddleware } from '@biashara-mall/error-handler';
import { sendLog } from '@biashara-mall/kafka';
import { recommendationsRouter } from './routes/recommendations';

const app = express();

app.use(express.json());
app.use(clerkMiddleware());
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

app.get('/api', (req, res) => {
  res.send({ message: 'Welcome to recommendation-service!' });
});

app.use('/api', recommendationsRouter);

app.use(createErrorMiddleware('recommendation-service'));

const port = process.env.PORT || 6007;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
  void sendLog({
    type: 'info',
    message: `recommendation-service started on port ${port}`,
    source: 'recommendation-service',
  });
});
server.on('error', console.error);
