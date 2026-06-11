// Централізована конфігурація з .env
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// Безпека JWT-секрету:
//  - у production секрет ОБОВ'ЯЗКОВО задається через змінну середовища;
//  - у розробці, якщо секрет не задано, генерується випадковий на час запуску
//    (токени стають недійсними після перезапуску — це очікувано для dev).
const INSECURE_SECRETS = ['super_secret_change_me', 'change_me_in_production'];
let jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || INSECURE_SECRETS.includes(jwtSecret)) {
  if (isProduction) {
    throw new Error(
      'JWT_SECRET не задано або має небезпечне значення. ' +
      'Задайте надійний секрет через змінну середовища JWT_SECRET.'
    );
  }
  jwtSecret = crypto.randomBytes(32).toString('hex');
  console.warn(
    '⚠️  JWT_SECRET не задано — згенеровано тимчасовий секрет для розробки. ' +
    'Для стабільних сесій додайте JWT_SECRET у .env.'
  );
}

export const config = {
  isProduction,
  port: Number(process.env.PORT || 4000),
  databaseUrl:
    process.env.DATABASE_URL ||
    'postgres://postgres:postgres@localhost:5432/studorg_docflow',
  jwt: {
    secret: jwtSecret,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.MAIL_FROM || 'noreply@studorg-docflow.local',
  },
  uploadLimitBytes: 10 * 1024 * 1024, // 10 МБ
};
