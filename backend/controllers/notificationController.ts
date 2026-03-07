import { Request, Response } from "express";
import Notification from "../models/Notification";
import { emitUnreadCount } from "../socket/socketServer";

interface AuthRequest extends Request { user?: { id: string; role: string }; }

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId     = req.user!.id;
    const page       = Math.max(1, parseInt(req.query.page  as string) || 1);
    const limit      = Math.min(50, parseInt(req.query.limit as string) || 20);
    const unreadOnly = req.query.unread === "true";
    const filter: Record<string, unknown> = { recipient: userId };
    if (unreadOnly) filter.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit).lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient: userId, isRead: false }),
    ]);

    res.status(200).json({
      success: true,
      data: { notifications, pagination: { page, limit, total, totalPages: Math.ceil(total/limit) }, unreadCount },
    });
  } catch (e) { console.error("[notificationController.getNotifications]", e);
    res.status(500).json({ success: false, message: "Internal server error." }); }
};

export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const count = await Notification.countDocuments({ recipient: req.user!.id, isRead: false });
    res.status(200).json({ success: true, data: { count } });
  } catch (e) { res.status(500).json({ success: false, message: "Internal server error." }); }
};

export const markNotificationsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { notificationIds } = req.body as { notificationIds?: string[] };
    const filter: Record<string, unknown> = { recipient: userId, isRead: false };
    if (notificationIds?.length) filter._id = { $in: notificationIds };

    await Notification.updateMany(filter, { $set: { isRead: true } });
    const remaining = await Notification.countDocuments({ recipient: userId, isRead: false });
    emitUnreadCount(userId, remaining);

    res.status(200).json({ success: true, message: "Marked as read.", data: { unreadCount: remaining } });
  } catch (e) { res.status(500).json({ success: false, message: "Internal server error." }); }
};

export const deleteNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const deleted = await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user!.id });
    if (!deleted) { res.status(404).json({ success: false, message: "Not found." }); return; }
    res.status(200).json({ success: true, message: "Deleted." });
  } catch (e) { res.status(500).json({ success: false, message: "Internal server error." }); }
};