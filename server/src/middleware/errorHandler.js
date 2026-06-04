// Обгортка для асинхронних обробників — ловить помилки в проміжному ПЗ
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Централізований обробник помилок
export function errorHandler(err, req, res, _next) {
  console.error('Помилка:', err.message);

  // Порушення унікальності PostgreSQL
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Запис із такими даними вже існує' });
  }
  // Порушення зовнішнього ключа
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Посилання на неіснуючий запис' });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Внутрішня помилка сервера',
  });
}

// 404
export function notFound(req, res) {
  res.status(404).json({ error: 'Ресурс не знайдено' });
}
