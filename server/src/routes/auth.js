import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import * as ctrl from '../controllers/auth.controller.js';

const router = Router();

// Суворіший ліміт для входу/реєстрації — захист від перебору паролів
const authLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  message: 'Забагато спроб. Зачекайте хвилину та спробуйте ще раз',
});

router.post('/register', authLimiter, asyncHandler(ctrl.register));
router.post('/login', authLimiter, asyncHandler(ctrl.login));
router.get('/me', authenticate, asyncHandler(ctrl.me));

// Особистий профіль: пошта/контакти та зміна пароля
router.put('/profile', authenticate, asyncHandler(ctrl.updateProfile));
router.put('/password', authenticate, authLimiter, asyncHandler(ctrl.changePassword));

export default router;
