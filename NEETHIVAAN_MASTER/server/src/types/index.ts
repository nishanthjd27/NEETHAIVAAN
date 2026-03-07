// path: server/src/types/index.ts
// Phase 3 updated — adds ROLES map, IHistoryEntry, Phase 3 status values.
// All Phase 1 & 2 types kept intact — zero breaking changes.

import { Request } from 'express';
import { Types }   from 'mongoose';

// ── User Roles ────────────────────────────────────────────────────────────────
// DB stores lowercase: 'user' | 'lawyer' | 'admin'
export type UserRole = 'user' | 'lawyer' | 'admin';

// Phase 3: uppercase role aliases for middleware convenience.
// requireRole('ADMIN')  → maps to 'admin'
// requireRole('LAWYER') → maps to 'lawyer'
// requireRole('CITIZEN')→ maps to 'user'
export const ROLES = {
  ADMIN:   'admin'  as UserRole,
  LAWYER:  'lawyer' as UserRole,
  CITIZEN: 'user'   as UserRole,
} as const;

// Accepted role strings in requireRole() — either format works
export type RoleAlias = UserRole | 'ADMIN' | 'LAWYER' | 'CITIZEN';

// ── JWT Payload ───────────────────────────────────────────────────────────────
export interface JwtPayload {
  id:    string;
  role:  UserRole;
  email: string;
  iat?:  number;
  exp?:  number;
}

// ── Authenticated Request ─────────────────────────────────────────────────────
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// ── API Response ──────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success:  boolean;
  message?: string;
  data?:    T;
  error?:   string;
}

// ── Pagination ────────────────────────────────────────────────────────────────
export interface PaginationResult<T> {
  items:   T[];
  total:   number;
  page:    number;
  pages:   number;
  limit:   number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ── Complaint Status ──────────────────────────────────────────────────────────
// Phase 2 values kept. Phase 3 aliases added.
export type ComplaintStatus =
  | 'Submitted'    // Phase 2
  | 'Under Review' // Phase 2
  | 'In Progress'  // Phase 2
  | 'Escalated'    // Phase 2
  | 'Resolved'     // Phase 2
  | 'Closed'       // Phase 2
  | 'OPEN'         // Phase 3 alias
  | 'IN_PROGRESS'  // Phase 3 alias
  | 'RESOLVED'     // Phase 3 alias
  | 'REJECTED';    // Phase 3 alias

export type ComplaintPriority = 'Low' | 'Medium' | 'High' | 'Critical';

// ── Case Stage ────────────────────────────────────────────────────────────────
export type CaseStage =
  | 'Filed'
  | 'Under Review'
  | 'Investigation'
  | 'Hearing'
  | 'Judgment'
  | 'Closed';

// ── Phase 3: History Entry ────────────────────────────────────────────────────
// Structured admin/lawyer action log stored on each complaint.
export interface IHistoryEntry {
  action:    string;
  updatedBy: Types.ObjectId;
  timestamp: Date;
}

// ── Chatbot ───────────────────────────────────────────────────────────────────
export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type Language  = 'en' | 'hi' | 'ta';

export interface ChatbotResponse {
  intent:          string;
  legalDomain:     string;
  relevantActs:    string[];
  explanation:     string;
  nextSteps:       string[];
  riskLevel:       RiskLevel;
  confidenceScore: number;
  language:        Language;
}

// ── App Error ─────────────────────────────────────────────────────────────────
export interface AppError extends Error {
  statusCode?:    number;
  isOperational?: boolean;
}
