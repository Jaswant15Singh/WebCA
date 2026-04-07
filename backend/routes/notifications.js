import express from 'express';
const router = express.Router();
import notificationController from '../controllers/notifications.js';
router.get("/all-notifications/:admin_id",notificationController.getNotifications);
router.get("/due-projects/:admin_id",notificationController.dueProjects);

export default router;