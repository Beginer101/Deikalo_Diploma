import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';
import * as ctrl from '../controllers/document.controller.js';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(ctrl.list));
router.get('/:id', asyncHandler(ctrl.getById));
router.post('/', asyncHandler(ctrl.create));
router.put('/:id', asyncHandler(ctrl.update));
router.post('/:id/submit', asyncHandler(ctrl.submit));
router.post('/:id/decision', asyncHandler(ctrl.decide));
router.post('/:id/delegate', asyncHandler(ctrl.delegate));
router.post('/:id/comments', asyncHandler(ctrl.addComment));
router.delete('/:id', asyncHandler(ctrl.remove));

export default router;
