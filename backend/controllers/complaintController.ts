export const updateComplaintStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;
    const updatedBy = (req as any).user.id;

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      res.status(404).json({ success: false, message: "Not found." });
      return;
    }

    const oldStatus = complaint.status;

    complaint.status = status;
    if (remarks) complaint.remarks = remarks;

    await complaint.save();

    const recipientId = complaint.assignedTo?.toString();

    emitStatusChange({
      complaintId: complaint._id.toString(),
      ticketNumber: complaint.ticketNumber,
      oldStatus,
      newStatus: status,
      updatedBy,
      timestamp: new Date().toISOString(),
    }, recipientId);

    if (recipientId && recipientId !== updatedBy) {

      const notification = await Notification.create({
        recipient: recipientId,
        complaintId: complaint._id,
        ticketNumber: complaint.ticketNumber,
        type: "status_change",
        title: `Complaint ${complaint.ticketNumber} Updated`,
        message: `Status changed from ${oldStatus} to ${status}.`,
        metadata: { oldStatus, newStatus: status }
      });

      emitNotification(recipientId, {
        notificationId: notification._id.toString(),
        recipientId,
        type: "status_change",
        title: notification.title,
        message: notification.message,
        ticketNumber: complaint.ticketNumber,
        complaintId: complaint._id.toString(),
        createdAt: notification.createdAt.toISOString()
      });

      const unread = await Notification.countDocuments({
        recipient: recipientId,
        isRead: false
      });

      emitUnreadCount(recipientId, unread);
    }

    res.status(200).json({
      success: true,
      message: "Status updated.",
      data: complaint
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};