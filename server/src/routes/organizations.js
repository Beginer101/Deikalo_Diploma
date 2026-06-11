import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate, authorize } from '../middleware/auth.js';
import * as ctrl from '../controllers/organization.controller.js';

const router = Router();
router.use(authenticate);

// Приєднання за одноразовим посиланням (доступне будь-якому автентифікованому
// користувачу; реєструється до '/:id', щоб 'join' не сприймався як id)
router.post('/join/:token', asyncHandler(ctrl.join));

router.get('/', asyncHandler(ctrl.list));
router.get('/:id', asyncHandler(ctrl.getById));
router.post('/', authorize('admin'), asyncHandler(ctrl.create));
router.put('/:id', authorize('admin'), asyncHandler(ctrl.update));
router.delete('/:id', authorize('admin'), asyncHandler(ctrl.remove));

// Членство: надає та забирає лише адміністратор системи
router.post('/:id/members', authorize('admin'), asyncHandler(ctrl.addMember));
router.delete('/:id/members/:userId', authorize('admin'), asyncHandler(ctrl.removeMember));

// Запрошення: хед (своєї організації) або адміністратор
router.post('/:id/invites', authorize('admin', 'head'), asyncHandler(ctrl.createInvite));
router.get('/:id/invites', authorize('admin', 'head'), asyncHandler(ctrl.listInvites));

export default router;
