import mongoose, { Document, Schema } from "mongoose";

export interface IComplaint extends Document {
  ticketNumber: string;
  citizenName: string;
  citizenPhone: string;
  citizenEmail?: string;
  category: string;
  description: string;
  location: string;
  district: string;
  status: "pending" | "in_progress" | "resolved" | "rejected" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  assignedTo?: mongoose.Types.ObjectId;
  department?: string;
  remarks?: string;
  attachments?: string[];
  // ── Phase 4 ──────────────────────────────────────────────────────────────
  publicTrackingTokenHash: string;
  statusHistory: {
    status: string;
    changedAt: Date;
    changedBy?: mongoose.Types.ObjectId;
    note?: string;
  }[];
  resolvedAt?: Date;
  // ─────────────────────────────────────────────────────────────────────────
  createdAt: Date;
  updatedAt: Date;
}

const StatusHistorySchema = new Schema(
  {
    status:    { type: String, required: true },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: Schema.Types.ObjectId, ref: "User" },
    note:      { type: String },
  },
  { _id: false }
);

const ComplaintSchema = new Schema<IComplaint>(
  {
    ticketNumber:  { type: String, required: true, unique: true, trim: true },
    citizenName:   { type: String, required: true, trim: true },
    citizenPhone:  { type: String, required: true, trim: true },
    citizenEmail:  { type: String, trim: true, lowercase: true },
    category:      { type: String, required: true, trim: true },
    description:   { type: String, required: true },
    location:      { type: String, required: true },
    district:      { type: String, required: true, trim: true },

    status: {
      type: String,
      enum: ["pending", "in_progress", "resolved", "rejected", "closed"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    assignedTo:  { type: Schema.Types.ObjectId, ref: "User" },
    department:  { type: String, trim: true },
    remarks:     { type: String },
    attachments: [{ type: String }],

    // Phase 4 – SHA-256 hash of the one-time public tracking token
    publicTrackingTokenHash: {
      type:     String,
      required: true,
      unique:   true,
      index:    true,
    },

    statusHistory: { type: [StatusHistorySchema], default: [] },
    resolvedAt:    { type: Date },
  },
  { timestamps: true }
);

// Auto-append a history entry whenever status changes
ComplaintSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    this.statusHistory.push({
      status:    this.status,
      changedAt: new Date(),
      note:      "Status updated",
    });
    if (this.status === "resolved" && !this.resolvedAt) {
      this.resolvedAt = new Date();
    }
  }
  next();
});

export default mongoose.model<IComplaint>("Complaint", ComplaintSchema);
