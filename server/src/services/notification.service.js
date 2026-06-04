// Сервіс сповіщень: in-app сповіщення + email + журнал активності.
// Функції приймають db-виконавця (транзакційний клієнт або пул).
import { pool } from '../db/pool.js';
import * as notificationRepo from '../repositories/notification.repository.js';
import * as activityRepo from '../repositories/activity.repository.js';
import * as userRepo from '../repositories/user.repository.js';
import { sendMail } from './mailer.service.js';

// Створити сповіщення для користувача (+ email)
export async function notifyUser(db = pool, { userId, type, message, link }) {
  await notificationRepo.create(db, { userId, type, message, link });
  try {
    const email = await userRepo.findEmailById(db, userId);
    if (email) {
      await sendMail({
        to: email,
        subject: 'СтудОрг ДокФлоу: нове сповіщення',
        text: message + (link ? `\n\nПосилання: ${link}` : ''),
      });
    }
  } catch (e) {
    console.error('notifyUser email error:', e.message);
  }
}

// Запис у журнал активності
export async function logActivity(db = pool, entry) {
  await activityRepo.create(db, entry);
}

// Прямий доступ для маршрутів сповіщень
export const list = (userId, unreadOnly) => notificationRepo.list(pool, userId, unreadOnly);
export const countUnread = (userId) => notificationRepo.countUnread(pool, userId);
export const markRead = (id, userId) => notificationRepo.markRead(pool, id, userId);
export const markAllRead = (userId) => notificationRepo.markAllRead(pool, userId);
