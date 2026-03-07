import { Router } from "express";
import {
  getNotifications, getUnreadCount,
  markNotificationsRead, deleteNotification,
} from "../controllers/notificationController";
import { protect } from "../middleware/authMiddleware";

const router = Router();
router.use(protect);

router.get("/",             getNotifications);
router.get("/unread-count", getUnreadCount);
router.put("/mark-read",    markNotificationsRead);
router.delete("/:id",       deleteNotification);

export default router;