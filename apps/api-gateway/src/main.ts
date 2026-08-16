import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();

app.use(cors());

app.get('/api', (req, res) => {
  res.send({ message: 'Welcome to api-gateway!' });
});

const services: Record<string, string> = {
  '/user': 'http://localhost:6001',
  '/product': 'http://localhost:6002',
  '/seller': 'http://localhost:6003',
  '/order': 'http://localhost:6004',
  '/admin': 'http://localhost:6005',
};

for (const [prefix, target] of Object.entries(services)) {
  app.use(prefix, createProxyMiddleware({ target, changeOrigin: true }));
}

const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
