import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate, authenticateSSE } from '../middleware/auth.js';
import { subscribe } from '../lib/sseHub.js';
import * as ctrl from '../controllers/notification.controller.js';

const router = Router();

// SSE-стрім сповіщень у реальному часі (до router.use(authenticate),
// бо EventSource передає токен через query-параметр, а не заголовок)
router.get('/stream', authenticateSSE, (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // вимкнути буферизацію на проксі (nginx)
  });
  res.flushHeaders();
  res.write('retry: 5000\n\n'); // інтервал перепідключення клієнта

  const unsubscribe = subscribe(req.user.id, res);

  // Heartbeat: коментар-пінг, щоб проксі не закривали "тихе" з'єднання
  const heartbeat = setInterval(() => {
    try { res.write(': ping\n\n'); } catch { /* закрите */ }
  }, 25_000);

  req.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
});

router.use(authenticate);

router.get('/', asyncHandler(ctrl.list));
router.get('/count', asyncHandler(ctrl.count));
router.patch('/:id/read', asyncHandler(ctrl.markRead));
router.patch('/read-all', asyncHandler(ctrl.markAllRead));

export default router;
