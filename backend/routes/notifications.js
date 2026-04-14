import express from 'express';
const router = express.Router();
import notificationController from '../controllers/notifications.js';
import authMiddleware from "../middlewares/auth.js";
router.get("/all-notifications/:admin_id", authMiddleware, notificationController.getNotifications);
router.get("/due-projects/:admin_id", authMiddleware, notificationController.dueProjects);

export default router;
