import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate, authorize } from '../middleware/auth.js';
import * as ctrl from '../controllers/user.controller.js';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(ctrl.list));

// Запити на видалення (статичні шляхи — перед динамічними)
router.get('/deletion-requests', authorize('admin'), asyncHandler(ctrl.listDeletionRequests));
router.post('/deletion-requests/:id/approve', authorize('admin'), asyncHandler(ctrl.approveDeletion));
router.post('/deletion-requests/:id/reject', authorize('admin'), asyncHandler(ctrl.rejectDeletion));

router.patch('/:id/role', authorize('admin'), asyncHandler(ctrl.changeRole));
// Керівник або адміністратор подає запит на видалення
router.post('/:id/deletion-request', authorize('admin', 'head'), asyncHandler(ctrl.requestDeletion));
// Пряме видалення — лише адміністратор
router.delete('/:id', authorize('admin'), asyncHandler(ctrl.remove));

export default router;
