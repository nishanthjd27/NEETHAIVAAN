// path: server/src/models/Complaint.ts
// Core complaint document. Timeline array tracks every status change with actor/remark.

import { Schema, model, Document, Types } from 'mongoose';

export type ComplaintStatus = 'Submitted' | 'Under Review' | 'In Progress' | 'Escalated' | 'Resolved' | 'Closed';
export type ComplaintPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface ITimelineEntry {
  status: ComplaintStatus;
  by: Types.ObjectId;   // User who changed the status
  remark: string;
  at: Date;
}

export interface IComplaint extends Document {
  complaintId: string;   // NV-<timestamp>-<rand4>
  userId: Types.ObjectId;
  category: string;
  description: string;
  autoDraft: string;     // AI / template-generated complaint draft
  status: ComplaintStatus;
  priority: ComplaintPriority;
  timeline: ITimelineEntry[];
  adminRemarks: string;
  detectedIntent?: string;
  suggestedActs?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const TimelineEntrySchema = new Schema<ITimelineEntry>(
  {
    status:  { type: String, required: true },
    by:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
    remark:  { type: String, default: '' },
    at:      { type: Date, default: Date.now },
  },
  { _id: false }
);

const ComplaintSchema = new Schema<IComplaint>(
  {
    complaintId:    { type: String, required: true, unique: true, index: true },
    userId:         { type: Schema.Types.ObjectId, ref: 'User', required: true },
    category:       { type: String, required: true, trim: true },
    description:    { type: String, required: true, trim: true, maxlength: 5000 },
    autoDraft:      { type: String, default: '' },
    status:         { type: String, enum: ['Submitted','Under Review','In Progress','Escalated','Resolved','Closed'], default: 'Submitted' },
    priority:       { type: String, enum: ['Low','Medium','High','Critical'], default: 'Medium' },
    timeline:       { type: [TimelineEntrySchema], default: [] },
    adminRemarks:   { type: String, default: '' },
    detectedIntent: { type: String },
    suggestedActs:  { type: [String], default: [] },
  },
  { timestamps: true }
);

export const Complaint = model<IComplaint>('Complaint', ComplaintSchema);
