import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';
import * as ctrl from '../controllers/project.controller.js';

const router = Router();
router.use(authenticate);

// Детальні перевірки прав (admin/head/координатор) — у project.service.js
router.get('/', asyncHandler(ctrl.list));
router.get('/:id', asyncHandler(ctrl.getById));
router.post('/', asyncHandler(ctrl.create));
router.put('/:id', asyncHandler(ctrl.update));
router.post('/:id/members', asyncHandler(ctrl.addMember));
router.delete('/:id/members/:userId', asyncHandler(ctrl.removeMember));
router.delete('/:id', asyncHandler(ctrl.remove));

export default router;
