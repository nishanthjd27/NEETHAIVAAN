// path: server/src/models/AuditLog.ts
// Immutable audit trail. Never update/delete audit logs in production.

import { Schema, model, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  userId?: Types.ObjectId;
  action: string;        // e.g. 'login', 'complaint_create', 'status_update'
  entityType?: string;   // e.g. 'Complaint', 'User'
  entityId?: string;
  meta?: Record<string, unknown>;
  ip?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId:     { type: Schema.Types.ObjectId, ref: 'User' },
    action:     { type: String, required: true, index: true },
    entityType: { type: String },
    entityId:   { type: String },
    meta:       { type: Schema.Types.Mixed },
    ip:         { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AuditLog = model<IAuditLog>('AuditLog', AuditLogSchema);
