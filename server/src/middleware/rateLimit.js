// Обмеження частоти запитів (rate limiting) без зовнішніх залежностей.
// Алгоритм фіксованого вікна: на кожен IP рахуємо запити в межах windowMs;
// після перевищення max — відповідь 429 Too Many Requests.
// Для дипломного проєкту in-memory сховища достатньо; у кластері
// знадобився б спільний бекенд (наприклад, Redis).

export function rateLimit({
  windowMs = 60_000,
  max = 100,
  message = 'Забагато запитів, спробуйте пізніше',
  keyFn = (req) => req.ip,
} = {}) {
  const hits = new Map(); // key -> { count, resetAt }

  // Періодичне прибирання прострочених записів, щоб Map не розростався
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  }, windowMs);
  cleanup.unref?.(); // не тримати процес живим заради таймера

  return function rateLimitMiddleware(req, res, next) {
    const key = keyFn(req);
    const now = Date.now();

    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;

    res.set('X-RateLimit-Limit', String(max));
    res.set('X-RateLimit-Remaining', String(Math.max(0, max - entry.count)));

    if (entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({ error: message });
    }
    next();
  };
}
