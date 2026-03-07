// path: server/src/models/AuditLog.ts
// Immutable audit trail for all important user actions.
// Rule: NEVER update or delete audit logs in production.

import { Schema, model, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  userId?:    Types.ObjectId;
  action:     string;
  entityType?: string;
  entityId?:  string;
  meta?:      Record<string, unknown>;
  ip?:        string;
  userAgent?: string;
  createdAt:  Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId:     { type: Schema.Types.ObjectId, ref: 'User', index: true },
    action:     { type: String, required: true, index: true },
    entityType: { type: String },
    entityId:   { type: String, index: true },
    meta:       { type: Schema.Types.Mixed },
    ip:         { type: String },
    userAgent:  { type: String },
  },
  {
    timestamps:  { createdAt: true, updatedAt: false }, // Never updated
    versionKey:  false,
  }
);

export const AuditLog = model<IAuditLog>('AuditLog', AuditLogSchema);
