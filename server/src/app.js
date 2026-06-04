// Налаштування Express-застосунку (без запуску сервера — зручно для тестів)
import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import apiRoutes from './routes/index.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // CLIENT_ORIGIN='*' → дозволити будь-яке джерело (ми використовуємо Bearer-токени,
  // а не cookie, тож це безпечно). Інакше — точний дозволений домен.
  app.use(cors({ origin: config.clientOrigin === '*' ? true : config.clientOrigin }));
  app.use(express.json());

  app.use('/api', apiRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
