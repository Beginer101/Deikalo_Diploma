// Централізована конфігурація з .env
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: Number(process.env.PORT || 4000),
  databaseUrl:
    process.env.DATABASE_URL ||
    'postgres://postgres:postgres@localhost:5432/studorg_docflow',
  jwt: {
    secret: process.env.JWT_SECRET || 'super_secret_change_me',
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
