// path: server/src/models/Complaint.ts
// Phase 3 extended — added history[] array and Phase 3 status enum values.
// All Phase 2 fields kept intact. Zero breaking changes.

import { Schema, model, Document, Types } from 'mongoose';
import {
  ComplaintStatus,
  ComplaintPriority,
  CaseStage,
  IHistoryEntry,
} from '../types';

// ── Sub-document Interfaces ───────────────────────────────────────────────────

export interface ITimelineEntry {
  action:    string;
  remark:    string;
  changedBy: Types.ObjectId;
  at:        Date;
}

export interface IHearingDate {
  date:         Date;
  venue:        string;
  notes:        string;
  reminderSent: boolean;
}

export interface IDocument {
  filename:   string;
  url:        string;
  publicId:   string;
  uploadedBy: Types.ObjectId;
  uploadedAt: Date;
}

export interface IComment {
  userId:    Types.ObjectId;
  text:      string;
  createdAt: Date;
}

// ── Main Complaint Interface ──────────────────────────────────────────────────

export interface IComplaint extends Document {
  // Identity
  complaintId:         string;
  publicTrackingToken: string;

  // Core
  title:               string;
  description:         string;
  category:            string;
  autoDraft:           string;

  // Status & Priority
  status:              ComplaintStatus;
  priority:            ComplaintPriority;

  // Case Lifecycle
  caseStage:           CaseStage;
  assignedLawyer?:     Types.ObjectId;
  resolutionSummary?:  string;

  // Phase 2 arrays
  timeline:            ITimelineEntry[];
  hearingDates:        IHearingDate[];
  documents:           IDocument[];
  comments:            IComment[];

  // Phase 3 — structured admin/lawyer action log
  history:             IHistoryEntry[];

  // AI
  detectedIntent?:     string;
  suggestedActs?:      string[];
  aiRiskLevel?:        string;

  // Relations
  createdBy:           Types.ObjectId;

  // Timestamps
  resolvedAt?:         Date;
  createdAt:           Date;
  updatedAt:           Date;
}

// ── Sub-document Schemas ──────────────────────────────────────────────────────

const TimelineEntrySchema = new Schema<ITimelineEntry>(
  {
    action:    { type: String, required: true },
    remark:    { type: String, default: '' },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    at:        { type: Date, default: () => new Date() },
  },
  { _id: false }
);

const HearingDateSchema = new Schema<IHearingDate>(
  {
    date:         { type: Date,    required: true },
    venue:        { type: String,  default: '' },
    notes:        { type: String,  default: '' },
    reminderSent: { type: Boolean, default: false },
  },
  { _id: true }
);

const DocumentSchema = new Schema<IDocument>(
  {
    filename:   { type: String, required: true },
    url:        { type: String, required: true },
    publicId:   { type: String, default: '' },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedAt: { type: Date, default: () => new Date() },
  },
  { _id: true }
);

const CommentSchema = new Schema<IComment>(
  {
    userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text:      { type: String, required: true, maxlength: 2000 },
    createdAt: { type: Date, default: () => new Date() },
  },
  { _id: true }
);

// Phase 3 — History entry schema
const HistoryEntrySchema = new Schema<IHistoryEntry>(
  {
    action:    { type: String, required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    timestamp: { type: Date, default: () => new Date() },
  },
  { _id: false }
);

// ── Main Complaint Schema ─────────────────────────────────────────────────────

const ComplaintSchema = new Schema<IComplaint>(
  {
    complaintId: {
      type: String, required: true, unique: true, index: true, trim: true,
    },
    publicTrackingToken: {
      type: String, unique: true, sparse: true, index: true,
    },
    title: {
      type: String, required: true, trim: true, minlength: 5, maxlength: 200,
    },
    description: {
      type: String, required: true, trim: true, minlength: 10, maxlength: 10000,
    },
    category: {
      type: String, required: true, trim: true,
    },
    autoDraft: {
      type: String, default: '',
    },

    // Phase 2 + Phase 3 status values
    status: {
      type: String,
      enum: [
        'Submitted', 'Under Review', 'In Progress', 'Escalated', 'Resolved', 'Closed',
        'OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED',
      ],
      default: 'Submitted',
      index:   true,
    },

    priority: {
      type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium',
    },

    caseStage: {
      type: String,
      enum: ['Filed', 'Under Review', 'Investigation', 'Hearing', 'Judgment', 'Closed'],
      default: 'Filed',
      index:   true,
    },

    assignedLawyer: {
      type: Schema.Types.ObjectId, ref: 'User', default: null,
    },

    resolutionSummary: {
      type: String, default: '',
    },

    // Phase 2 arrays
    timeline:     { type: [TimelineEntrySchema], default: [] },
    hearingDates: { type: [HearingDateSchema],   default: [] },
    documents:    { type: [DocumentSchema],       default: [] },
    comments:     { type: [CommentSchema],        default: [] },

    // Phase 3 — history
    history:      { type: [HistoryEntrySchema],   default: [] },

    // AI fields
    detectedIntent: { type: String },
    suggestedActs:  { type: [String], default: [] },
    aiRiskLevel:    { type: String },

    createdBy: {
      type: Schema.Types.ObjectId, ref: 'User', required: true, index: true,
    },

    resolvedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

// Indexes
ComplaintSchema.index({ createdBy: 1,      createdAt: -1 });
ComplaintSchema.index({ status: 1,          createdAt: -1 });
ComplaintSchema.index({ caseStage: 1,       status: 1     });
ComplaintSchema.index({ assignedLawyer: 1,  status: 1     });
ComplaintSchema.index({ title: 'text', description: 'text', category: 'text' });

export const Complaint = model<IComplaint>('Complaint', ComplaintSchema);
