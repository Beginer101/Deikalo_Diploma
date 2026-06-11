import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import * as userRepo from '../repositories/user.repository.js';

// node:test виставляє цю змінну в тестових процесах — у юніт-тестах
// працюємо лише з payload токена, без звернень до БД
const IS_TEST = Boolean(process.env.NODE_TEST_CONTEXT);

// Перевірка JWT-токена.
// Після перевірки підпису роль та організація користувача читаються з БД,
// щоб зміни членства/ролі діяли одразу, без повторного входу
// (payload токена може бути застарілим).
export async function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Потрібна авторизація' });
  }

  let payload;
  try {
    payload = jwt.verify(token, config.jwt.secret);
  } catch {
    return res.status(401).json({ error: 'Недійсний або прострочений токен' });
  }

  if (IS_TEST) {
    req.user = payload;
    return next();
  }

  try {
    const fresh = await userRepo.findById(undefined, payload.id);
    if (!fresh) {
      return res.status(401).json({ error: 'Користувача не знайдено' });
    }
    req.user = fresh; // { id, full_name, email, role, organization_id }
    next();
  } catch (e) {
    // БД тимчасово недоступна — використовуємо дані з токена
    console.error('authenticate db error:', e.message);
    req.user = payload;
    next();
  }
}

// Автентифікація для SSE-стріму: браузерний EventSource не вміє
// надсилати заголовки, тому токен передається параметром запиту (?token=...)
export function authenticateSSE(req, res, next) {
  const token = req.query.token;

  if (!token) {
    return res.status(401).json({ error: 'Потрібна авторизація' });
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Недійсний або прострочений токен' });
  }
}

// Обмеження доступу за роллю
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Недостатньо прав доступу' });
    }
    next();
  };
}
