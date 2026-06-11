// Хаб Server-Sent Events (SSE): зберігає відкриті з'єднання користувачів
// і дозволяє надсилати їм події в реальному часі без зовнішніх залежностей
// (на відміну від WebSocket, SSE працює поверх звичайного HTTP).

const clients = new Map(); // userId -> Set<ServerResponse>

// Підписати з'єднання користувача. Повертає функцію відписки.
export function subscribe(userId, res) {
  if (!clients.has(userId)) clients.set(userId, new Set());
  clients.get(userId).add(res);

  return function unsubscribe() {
    const set = clients.get(userId);
    if (!set) return;
    set.delete(res);
    if (set.size === 0) clients.delete(userId);
  };
}

// Надіслати подію всім відкритим з'єднанням користувача.
// Повертає кількість з'єднань, яким надіслано подію.
export function publish(userId, event, data) {
  const set = clients.get(userId);
  if (!set || set.size === 0) return 0;

  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  let sent = 0;
  for (const res of set) {
    try {
      res.write(payload);
      sent += 1;
    } catch {
      // З'єднання вже закрите — буде прибране обробником 'close'
    }
  }
  return sent;
}

// Кількість активних з'єднань користувача (для тестів/діагностики)
export function connectionCount(userId) {
  return clients.get(userId)?.size || 0;
}
