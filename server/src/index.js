// Точка входу: запуск HTTP-сервера
import { createApp } from './app.js';
import { config } from './config/env.js';

const app = createApp();

app.listen(config.port, () => {
  console.log(`🚀 Сервер запущено на http://localhost:${config.port}`);
});
