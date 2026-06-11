// Сервіс сповіщень: in-app сповіщення + real-time (SSE) + email + журнал активності.
// Функції приймають db-виконавця (транзакційний клієнт або пул).
import { pool } from '../db/pool.js';
import * as notificationRepo from '../repositories/notification.repository.js';
import * as activityRepo from '../repositories/activity.repository.js';
import * as userRepo from '../repositories/user.repository.js';
import { sendMail } from './mailer.service.js';
import { publish } from '../lib/sseHub.js';

// Створити сповіщення для користувача (+ real-time подія + email)
export async function notifyUser(db = pool, { userId, type, message, link }) {
  await notificationRepo.create(db, { userId, type, message, link });

  // Миттєва доставка відкритим вкладкам користувача через SSE.
  // Примітка: якщо викликається всередині транзакції, подія надсилається
  // до COMMIT — для сповіщень це прийнятно (клієнт перечитує лічильник з БД).
  publish(userId, 'notification', { type, message, link });
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

// Сповістити "спостерігачів" дії: хедів організації (якщо organizationId
// вказано) та всіх адміністраторів системи. Автор дії виключається.
export async function notifyWatchers(db = pool, { organizationId, actorId, message, link }) {
  const watchers = await userRepo.findWatchers(db, organizationId || null);
  for (const w of watchers) {
    if (actorId && w.id === Number(actorId)) continue;
    await notifyUser(db, { userId: w.id, type: 'activity', message, link });
  }
}

// Запис у журнал активності + автоматичний фан-аут сповіщень спостерігачам.
// entry: { userId, entityType, entityId, action, summary,
//          organizationId?, link? } — останні два використовуються
// лише для сповіщень і не зберігаються в журналі.
export async function logActivity(db = pool, entry) {
  await activityRepo.create(db, entry);
  try {
    await notifyWatchers(db, {
      organizationId: entry.organizationId,
      actorId: entry.userId,
      message: entry.summary,
      link: entry.link,
    });
  } catch (e) {
    console.error('logActivity watchers error:', e.message);
  }
}

// Прямий доступ для маршрутів сповіщень
export const list = (userId, unreadOnly) => notificationRepo.list(pool, userId, unreadOnly);
export const countUnread = (userId) => notificationRepo.countUnread(pool, userId);
export const markRead = (id, userId) => notificationRepo.markRead(pool, id, userId);
export const markAllRead = (userId) => notificationRepo.markAllRead(pool, userId);
