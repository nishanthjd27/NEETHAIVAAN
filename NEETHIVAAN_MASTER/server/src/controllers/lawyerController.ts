// path: server/src/controllers/lawyerController.ts
// Phase 3 — Lawyer workflow controller.
// Lawyers can view assigned complaints and add resolution summaries.
// All mutations push entries into both history[] and timeline[].

import { Response, NextFunction } from 'express';
import { Types }                  from 'mongoose';
import { z }                      from 'zod';
import { Complaint }              from '../models/Complaint';
import { AuditLog }               from '../models/AuditLog';
import { AuthRequest }            from '../types';
import { asyncHandler }           from '../utils/asyncHandler';
import { successResponse, paginatedResponse } from '../utils/response';
import { createError }            from '../middleware/errorHandler';

// ── Validation Schemas ────────────────────────────────────────────────────────

const ResolutionSchema = z.object({
  resolutionSummary: z
    .string()
    .min(10,  'Resolution summary must be at least 10 characters')
    .max(5000, 'Resolution summary cannot exceed 5000 characters'),
  remark: z.string().max(500).optional().default(''),
});

const StageUpdateSchema = z.object({
  caseStage: z.enum(['Filed', 'Under Review', 'Investigation', 'Hearing', 'Judgment', 'Closed']),
  remark:    z.string().max(500).optional().default(''),
});

// ── Helper: push history entry ────────────────────────────────────────────────

function pushHistory(
  complaint: InstanceType<typeof Complaint>,
  action:    string,
  userId:    string
): void {
  complaint.history.push({
    action,
    updatedBy: new Types.ObjectId(userId),
    timestamp: new Date(),
  });
}

// ── 1. GET /api/lawyer/assigned ───────────────────────────────────────────────
// Returns only complaints assigned to the logged-in lawyer.

export const getAssignedComplaints = asyncHandler(async (
  req: AuthRequest, res: Response
) => {
  const {
    status, caseStage,
    page  = '1',
    limit = '15',
    sort  = '-createdAt',
  } = req.query as Record<string, string>;

  const pageNum  = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip     = (pageNum - 1) * limitNum;

  // Base filter — lawyer sees ONLY their assigned complaints
  const filter: Record<string, unknown> = {
    assignedLawyer: req.user!.id,
  };

  if (status)    filter.status    = status;
  if (caseStage) filter.caseStage = caseStage;

  const [complaints, total] = await Promise.all([
    Complaint.find(filter)
      .populate('createdBy', 'name email phone')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .select('-autoDraft -documents'),
    Complaint.countDocuments(filter),
  ]);

  return paginatedResponse(
    res, complaints, total, pageNum, limitNum,
    `Found ${total} assigned complaint(s)`
  );
});

// ── 2. GET /api/lawyer/assigned/:id ──────────────────────────────────────────
// Get full detail of a single assigned complaint.

export const getAssignedComplaintDetail = asyncHandler(async (
  req: AuthRequest, res: Response, next: NextFunction
) => {
  const complaint = await Complaint.findOne({
    complaintId:    req.params.id,
    assignedLawyer: req.user!.id,
  })
    .populate('createdBy', 'name email phone')
    .populate('comments.userId', 'name avatar role');

  if (!complaint) {
    return next(createError(
      `Complaint '${req.params.id}' not found or not assigned to you`, 404
    ));
  }

  return successResponse(res, { complaint }, 'Complaint detail fetched');
});

// ── 3. PATCH /api/lawyer/add-resolution/:id ───────────────────────────────────
// Lawyer adds resolution summary + optionally closes the case stage.

export const addResolutionSummary = asyncHandler(async (
  req: AuthRequest, res: Response, next: NextFunction
) => {
  const parsed = ResolutionSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(createError(parsed.error.errors.map(e => e.message).join(', ')));
  }

  // Lawyer can only update complaints assigned to them
  const complaint = await Complaint.findOne({
    complaintId:    req.params.id,
    assignedLawyer: req.user!.id,
  });

  if (!complaint) {
    return next(createError(
      `Complaint '${req.params.id}' not found or not assigned to you`, 404
    ));
  }

  const { resolutionSummary, remark } = parsed.data;

  complaint.resolutionSummary = resolutionSummary;

  pushHistory(
    complaint,
    `Resolution summary added by lawyer${remark ? `. Note: ${remark}` : ''}`,
    req.user!.id
  );

  complaint.timeline.push({
    action:    'Resolution Summary Added',
    remark:    remark || resolutionSummary.slice(0, 100),
    changedBy: new Types.ObjectId(req.user!.id),
    at:        new Date(),
  });

  await complaint.save();

  await AuditLog.create({
    userId:     req.user!.id,
    action:     'lawyer_add_resolution',
    entityType: 'Complaint',
    entityId:   complaint.complaintId,
    meta:       { summaryLength: resolutionSummary.length },
    ip:         req.ip,
  });

  return successResponse(
    res,
    { complaint },
    'Resolution summary saved successfully'
  );
});

// ── 4. PATCH /api/lawyer/update-stage/:id ─────────────────────────────────────
// Lawyer can update the case stage of assigned complaints.

export const updateAssignedComplaintStage = asyncHandler(async (
  req: AuthRequest, res: Response, next: NextFunction
) => {
  const parsed = StageUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(createError(parsed.error.errors.map(e => e.message).join(', ')));
  }

  const complaint = await Complaint.findOne({
    complaintId:    req.params.id,
    assignedLawyer: req.user!.id,
  });

  if (!complaint) {
    return next(createError(
      `Complaint '${req.params.id}' not found or not assigned to you`, 404
    ));
  }

  const { caseStage, remark } = parsed.data;
  const prevStage = complaint.caseStage;

  complaint.caseStage = caseStage;

  pushHistory(
    complaint,
    `Stage updated by lawyer: ${prevStage} → ${caseStage}${remark ? `. Note: ${remark}` : ''}`,
    req.user!.id
  );

  complaint.timeline.push({
    action:    `Stage: ${prevStage} → ${caseStage}`,
    remark:    remark || '',
    changedBy: new Types.ObjectId(req.user!.id),
    at:        new Date(),
  });

  await complaint.save();

  await AuditLog.create({
    userId:     req.user!.id,
    action:     'lawyer_update_stage',
    entityType: 'Complaint',
    entityId:   complaint.complaintId,
    meta:       { prevStage, newStage: caseStage, remark },
    ip:         req.ip,
  });

  return successResponse(res, { complaint }, `Case stage updated to '${caseStage}'`);
});

// ── 5. GET /api/lawyer/stats ──────────────────────────────────────────────────
// Personal dashboard stats for the logged-in lawyer.

export const getLawyerStats = asyncHandler(async (
  req: AuthRequest, res: Response
) => {
  const lawyerId = req.user!.id;

  const [total, statusCounts, stageCounts] = await Promise.all([
    Complaint.countDocuments({ assignedLawyer: lawyerId }),
    Complaint.aggregate([
      { $match: { assignedLawyer: new Types.ObjectId(lawyerId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Complaint.aggregate([
      { $match: { assignedLawyer: new Types.ObjectId(lawyerId) } },
      { $group: { _id: '$caseStage', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  return successResponse(res, {
    total,
    byStatus: statusCounts,
    byStage:  stageCounts,
  }, 'Lawyer stats fetched');
});
