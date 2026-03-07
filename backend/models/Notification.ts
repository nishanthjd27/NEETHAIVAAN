import mongoose, { Document, Schema } from "mongoose";

export type NotificationType =
  | "status_change" | "assignment" | "escalation"
  | "resolution"   | "rejection"  | "general";

export interface INotification extends Document {
  recipient:    mongoose.Types.ObjectId;
  complaintId:  mongoose.Types.ObjectId;
  ticketNumber: string;
  type:         NotificationType;
  title:        string;
  message:      string;
  isRead:       boolean;
  metadata?:    Record<string, unknown>;
  createdAt:    Date;
  updatedAt:    Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient:    { type: Schema.Types.ObjectId, ref: "User",      required: true, index: true },
    complaintId:  { type: Schema.Types.ObjectId, ref: "Complaint", required: true },
    ticketNumber: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["status_change","assignment","escalation","resolution","rejection","general"],
      default: "general",
    },
    title:    { type: String, required: true, trim: true },
    message:  { type: String, required: true },
    isRead:   { type: Boolean, default: false, index: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

NotificationSchema.index({ recipient: 1, isRead: 1 });

export default mongoose.model<INotification>("Notification", NotificationSchema);