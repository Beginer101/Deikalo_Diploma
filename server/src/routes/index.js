// Агрегатор усіх маршрутів API
import { Router } from 'express';
import authRoutes from './auth.js';
import organizationRoutes from './organizations.js';
import userRoutes from './users.js';
import projectRoutes from './projects.js';
import taskRoutes from './tasks.js';
import documentRoutes from './documents.js';
import dashboardRoutes from './dashboard.js';
import templateRoutes from './templates.js';
import attachmentRoutes from './attachments.js';
import notificationRoutes from './notifications.js';
import activityRoutes from './activity.js';
import metricRoutes from './metrics.js';

const router = Router();

router.get('/health', (req, res) => res.json({ status: 'ok' }));
router.use('/auth', authRoutes);
router.use('/organizations', organizationRoutes);
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);
router.use('/documents', documentRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/templates', templateRoutes);
router.use('/attachments', attachmentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/activity', activityRoutes);
router.use('/metrics', metricRoutes);

export default router;
