import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import * as ctrl from '../controllers/attachment.controller.js';

const router = Router();
router.use(authenticate);

router.get('/document/:documentId', asyncHandler(ctrl.listByDocument));
router.post('/document/:documentId', upload.single('file'), asyncHandler(ctrl.upload));
router.get('/:id/download', asyncHandler(ctrl.download));
router.delete('/:id', asyncHandler(ctrl.remove));

export default router;
