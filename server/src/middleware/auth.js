import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

// Перевірка JWT-токена
export function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Потрібна авторизація' });
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret);
    req.user = payload; // { id, role, organization_id, full_name }
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
