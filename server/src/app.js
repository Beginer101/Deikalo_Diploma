// Налаштування Express-застосунку (без запуску сервера — зручно для тестів)
import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import apiRoutes from './routes/index.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { rateLimit } from './middleware/rateLimit.js';

export function createApp() {
  const app = express();

  // За реверс-проксі (Render, nginx) — коректне визначення IP клієнта для rate limiting
  app.set('trust proxy', 1);

  // CLIENT_ORIGIN='*' → дозволити будь-яке джерело (ми використовуємо Bearer-токени,
  // а не cookie, тож це безпечно). Інакше — точний дозволений домен.
  app.use(cors({ origin: config.clientOrigin === '*' ? true : config.clientOrigin }));
  app.use(express.json());

  // Загальне обмеження частоти запитів до API
  app.use('/api', rateLimit({ windowMs: 60_000, max: 300 }));
  app.use('/api', apiRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
