// ADD these imports to your existing complaintController.ts
import Notification from "../models/Notification";
import { emitStatusChange, emitNotification, emitUnreadCount } from "../socket/socketServer";

// REPLACE your updateComplaintStatus with this:
export const updateComplaintStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id }              = req.params;
    const { status, remarks } = req.body as { status: string; remarks?: string };
    const updatedBy           = (req as any).user.id as string;

    const complaint = await Complaint.findById(id);
    if (!complaint) { res.status(404).json({ success: false, message: "Not found." }); return; }

    const oldStatus      = complaint.status;
    complaint.status     = status as any;
    if (remarks) complaint.remarks = remarks;
    await complaint.save();

    const recipientId = complaint.assignedTo?.toString();
    emitStatusChange({
      complaintId:  (complaint._id as any).toString(),
      ticketNumber: complaint.ticketNumber,
      oldStatus, newStatus: status, updatedBy,
      timestamp: new Date().toISOString(),
    }, recipientId);

    if (recipientId && recipientId !== updatedBy) {
      const labels: Record<string,string> = {
        pending:"Pending", in_progress:"In Progress",
        resolved:"Resolved", rejected:"Rejected", closed:"Closed",
      };
      const notification = await Notification.create({
        recipient: recipientId, complaintId: complaint._id,
        ticketNumber: complaint.ticketNumber, type: "status_change",
        title:   `Complaint ${complaint.ticketNumber} Updated`,
        message: `Status changed from ${labels[oldStatus] ?? oldStatus} to ${labels[status] ?? status}.`,
        metadata: { oldStatus, newStatus: status },
      });

      emitNotification(recipientId, {
        notificationId: (notification._id as any).toString(),
        recipientId, type: "status_change",
        title: notification.title, message: notification.message,
        ticketNumber: complaint.ticketNumber,
        complaintId: (complaint._id as any).toString(),
        createdAt: notification.createdAt.toISOString(),
      });

      const unread = await Notification.countDocuments({ recipient: recipientId, isRead: false });
      emitUnreadCount(recipientId, unread);
    }

    res.status(200).json({ success: true, message: "Status updated.", data: complaint });
  } catch (e) {
    console.error("[complaintController.updateComplaintStatus]", e);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};