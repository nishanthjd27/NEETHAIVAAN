// path: server/src/controllers/complaintController.ts
// Handles all complaint operations with full role-based access control.
//
// Access rules:
// ─ create:              any authenticated user
// ─ getAll:              admin/lawyer see all, users see own only
// ─ getOne:              owner, assigned lawyer, or admin
// ─ updateStatus:        admin or assigned lawyer
// ─ updateStage:         admin or assigned lawyer
// ─ assignLawyer:        admin only
// ─ addHearing:          admin or assigned lawyer
// ─ generatePublicToken: owner or admin
// ─ publicTrack:         anyone with valid token (no auth)

import { Response, NextFunction, Request } from 'express';
import { z }                               from 'zod';
import { Types }                           from 'mongoose';
import { Complaint }                       from '../models/Complaint';
import { User }                            from '../models/User';
import { AuditLog }                        from '../models/AuditLog';
import { AuthRequest, ComplaintStatus, CaseStage } from '../types';
import { asyncHandler }                    from '../utils/asyncHandler';
import { generateComplaintId }             from '../utils/complaintId';
import { generateTrackingToken }           from '../utils/trackingToken';
import { generateDraft }                   from '../utils/draftGenerator';
import { successResponse, paginatedResponse, errorResponse } from '../utils/response';
import { createError }                     from '../middleware/errorHandler';

// ── Validation Schemas ────────────────────────────────────────────────────────

const CreateComplaintSchema = z.object({
  title:       z.string().min(5,  'Title must be at least 5 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(10000),
  category:    z.string().min(2,  'Category is required').max(100),
  priority:    z.enum(['Low', 'Medium', 'High', 'Critical']).optional().default('Medium'),
});

const UpdateStatusSchema = z.object({
  status: z.enum(['Submitted', 'Under Review', 'In Progress', 'Escalated', 'Resolved', 'Closed']),
  remark: z.string().max(500).optional().default(''),
});

const UpdateStageSchema = z.object({
  caseStage: z.enum(['Filed', 'Under Review', 'Investigation', 'Hearing', 'Judgment', 'Closed']),
  remark:    z.string().max(500).optional().default(''),
});

const AddHearingSchema = z.object({
  date:  z.string().min(1, 'Hearing date is required'),
  venue: z.string().max(300).optional().default(''),
  notes: z.string().max(1000).optional().default(''),
});

const AssignLawyerSchema = z.object({
  lawyerId: z.string().min(1, 'Lawyer ID is required'),
});

// ── Helper: Verify Complaint Access ──────────────────────────────────────────

async function getComplaintOrFail(
  id:   string,
  next: NextFunction
) {
  const complaint = await Complaint.findOne({ complaintId: id })
    .populate('createdBy',     'name email role')
    .populate('assignedLawyer','name email role');

  if (!complaint) {
    next(createError(`Complaint '${id}' not found`, 404));
    return null;
  }
  return complaint;
}

function canAccessComplaint(
  complaint: InstanceType<typeof Complaint>,
  userId: string,
  role:   string
): boolean {
  if (role === 'admin') return true;
  if (complaint.createdBy._id.toString() === userId) return true;
  if (role === 'lawyer' && complaint.assignedLawyer?.toString() === userId) return true;
  return false;
}

function canModifyComplaint(
  complaint: InstanceType<typeof Complaint>,
  userId: string,
  role:   string
): boolean {
  if (role === 'admin') return true;
  if (role === 'lawyer' && complaint.assignedLawyer?.toString() === userId) return true;
  return false;
}

// ── 1. Create Complaint ───────────────────────────────────────────────────────

export const createComplaint = asyncHandler(async (
  req: AuthRequest, res: Response, next: NextFunction
) => {
  const result = CreateComplaintSchema.safeParse(req.body);
  if (!result.success) {
    return next(createError(result.error.errors.map(e => e.message).join(', ')));
  }

  const { title, description, category, priority } = result.data;
  const userId = req.user!.id;

  // Generate unique ID
  const complaintId = await generateComplaintId();

  // Generate tracking token
  const publicTrackingToken = generateTrackingToken();

  // Get user name for draft
  const user = await User.findById(userId);
  const userName = user?.name || 'Complainant';

  // Generate formal complaint draft letter
  const autoDraft = generateDraft({
    name:        userName,
    complaintId,
    category,
    description,
    date:        new Date().toLocaleDateString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric'
    }),
  });

  // Create complaint
  const complaint = await Complaint.create({
    complaintId,
    publicTrackingToken,
    title,
    description,
    category,
    priority,
    autoDraft,
    createdBy: userId,
    status:    'Submitted',
    caseStage: 'Filed',
    timeline: [{
      action:    'Complaint Filed',
      remark:    'Complaint submitted by user',
      changedBy: new Types.ObjectId(userId),
      at:        new Date(),
    }],
  });

  // Audit log
  await AuditLog.create({
    userId:     userId,
    action:     'complaint_created',
    entityType: 'Complaint',
    entityId:   complaintId,
    meta:       { title, category, priority },
    ip:         req.ip,
  });

  return successResponse(res, { complaint }, 'Complaint filed successfully', 201);
});

// ── 2. Get All Complaints (Role-Based) ────────────────────────────────────────

export const getAllComplaints = asyncHandler(async (
  req: AuthRequest, res: Response
) => {
  const {
    status, category, priority, caseStage,
    q, dateFrom, dateTo,
    page  = '1',
    limit = '10',
    sort  = '-createdAt',
  } = req.query as Record<string, string>;

  const pageNum  = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip     = (pageNum - 1) * limitNum;

  // ── Build Filter ──────────────────────────────────────────────────────────
  const filter: Record<string, unknown> = {};

  // Users see only their own complaints
  if (req.user!.role === 'user') {
    filter.createdBy = req.user!.id;
  }
  // Lawyers see assigned + own
  if (req.user!.role === 'lawyer') {
    filter.$or = [
      { createdBy:     req.user!.id },
      { assignedLawyer: req.user!.id },
    ];
  }
  // Admin sees all

  if (status)    filter.status    = status;
  if (category)  filter.category  = { $regex: category, $options: 'i' };
  if (priority)  filter.priority  = priority;
  if (caseStage) filter.caseStage = caseStage;

  if (dateFrom || dateTo) {
    const dateFilter: Record<string, Date> = {};
    if (dateFrom) dateFilter.$gte = new Date(dateFrom);
    if (dateTo)   dateFilter.$lte = new Date(dateTo + 'T23:59:59.999Z');
    filter.createdAt = dateFilter;
  }

  if (q && q.trim().length > 0) {
    filter.$text = { $search: q.trim() };
  }

  // ── Execute Query ─────────────────────────────────────────────────────────
  const [complaints, total] = await Promise.all([
    Complaint.find(filter)
      .populate('createdBy',      'name email')
      .populate('assignedLawyer', 'name email')
      .sort(q ? { score: { $meta: 'textScore' } } : sort)
      .skip(skip)
      .limit(limitNum)
      .select('-autoDraft -documents -comments'), // Lighter response for list view
    Complaint.countDocuments(filter),
  ]);

  return paginatedResponse(res, complaints, total, pageNum, limitNum);
});

// ── 3. Get Single Complaint ───────────────────────────────────────────────────

export const getComplaint = asyncHandler(async (
  req: AuthRequest, res: Response, next: NextFunction
) => {
  const complaint = await getComplaintOrFail(req.params.id, next);
  if (!complaint) return;

  // Access control
  if (!canAccessComplaint(complaint, req.user!.id, req.user!.role)) {
    return next(createError('You do not have permission to view this complaint', 403));
  }

  // Populate comments with user info
  await complaint.populate('comments.userId', 'name avatar role');

  return successResponse(res, { complaint }, 'Complaint fetched');
});

// ── 4. Update Complaint Status ────────────────────────────────────────────────

export const updateStatus = asyncHandler(async (
  req: AuthRequest, res: Response, next: NextFunction
) => {
  const result = UpdateStatusSchema.safeParse(req.body);
  if (!result.success) {
    return next(createError(result.error.errors.map(e => e.message).join(', ')));
  }

  const complaint = await getComplaintOrFail(req.params.id, next);
  if (!complaint) return;

  if (!canModifyComplaint(complaint, req.user!.id, req.user!.role)) {
    return next(createError('Only admin or assigned lawyer can update status', 403));
  }

  const { status, remark } = result.data;
  const prevStatus = complaint.status;

  complaint.status = status as ComplaintStatus;

  // Auto-set resolvedAt when resolved
  if (status === 'Resolved' || status === 'Closed') {
    complaint.resolvedAt = new Date();
  }

  // Append to timeline
  complaint.timeline.push({
    action:    `Status: ${prevStatus} → ${status}`,
    remark:    remark || '',
    changedBy: new Types.ObjectId(req.user!.id),
    at:        new Date(),
  });

  await complaint.save();

  await AuditLog.create({
    userId:     req.user!.id,
    action:     'complaint_status_updated',
    entityType: 'Complaint',
    entityId:   complaint.complaintId,
    meta:       { prevStatus, newStatus: status, remark },
    ip:         req.ip,
  });

  return successResponse(res, { complaint }, `Status updated to '${status}'`);
});

// ── 5. Update Case Stage ──────────────────────────────────────────────────────

export const updateCaseStage = asyncHandler(async (
  req: AuthRequest, res: Response, next: NextFunction
) => {
  const result = UpdateStageSchema.safeParse(req.body);
  if (!result.success) {
    return next(createError(result.error.errors.map(e => e.message).join(', ')));
  }

  const complaint = await getComplaintOrFail(req.params.id, next);
  if (!complaint) return;

  if (!canModifyComplaint(complaint, req.user!.id, req.user!.role)) {
    return next(createError('Only admin or assigned lawyer can update case stage', 403));
  }

  const { caseStage, remark } = result.data;
  const prevStage = complaint.caseStage;

  complaint.caseStage = caseStage as CaseStage;

  complaint.timeline.push({
    action:    `Stage: ${prevStage} → ${caseStage}`,
    remark:    remark || '',
    changedBy: new Types.ObjectId(req.user!.id),
    at:        new Date(),
  });

  await complaint.save();

  await AuditLog.create({
    userId:     req.user!.id,
    action:     'case_stage_updated',
    entityType: 'Complaint',
    entityId:   complaint.complaintId,
    meta:       { prevStage, newStage: caseStage },
    ip:         req.ip,
  });

  return successResponse(res, { complaint }, `Case stage updated to '${caseStage}'`);
});

// ── 6. Assign Lawyer ──────────────────────────────────────────────────────────

export const assignLawyer = asyncHandler(async (
  req: AuthRequest, res: Response, next: NextFunction
) => {
  const result = AssignLawyerSchema.safeParse(req.body);
  if (!result.success) {
    return next(createError(result.error.errors.map(e => e.message).join(', ')));
  }

  const complaint = await getComplaintOrFail(req.params.id, next);
  if (!complaint) return;

  // Verify lawyer exists and has correct role
  const lawyer = await User.findById(result.data.lawyerId);
  if (!lawyer || lawyer.role !== 'lawyer') {
    return next(createError('Lawyer not found or user is not a lawyer', 404));
  }

  complaint.assignedLawyer = new Types.ObjectId(result.data.lawyerId);
  complaint.timeline.push({
    action:    `Lawyer Assigned: ${lawyer.name}`,
    remark:    `Assigned by admin`,
    changedBy: new Types.ObjectId(req.user!.id),
    at:        new Date(),
  });

  await complaint.save();

  await AuditLog.create({
    userId:     req.user!.id,
    action:     'lawyer_assigned',
    entityType: 'Complaint',
    entityId:   complaint.complaintId,
    meta:       { lawyerId: lawyer.id, lawyerName: lawyer.name },
    ip:         req.ip,
  });

  return successResponse(res, { complaint }, `Lawyer '${lawyer.name}' assigned`);
});

// ── 7. Add Hearing Date ───────────────────────────────────────────────────────

export const addHearingDate = asyncHandler(async (
  req: AuthRequest, res: Response, next: NextFunction
) => {
  const result = AddHearingSchema.safeParse(req.body);
  if (!result.success) {
    return next(createError(result.error.errors.map(e => e.message).join(', ')));
  }

  const complaint = await getComplaintOrFail(req.params.id, next);
  if (!complaint) return;

  if (!canModifyComplaint(complaint, req.user!.id, req.user!.role)) {
    return next(createError('Only admin or assigned lawyer can add hearings', 403));
  }

  const hearingDate = new Date(result.data.date);
  if (isNaN(hearingDate.getTime())) {
    return next(createError('Invalid hearing date format', 400));
  }

  complaint.hearingDates.push({
    date:         hearingDate,
    venue:        result.data.venue || '',
    notes:        result.data.notes || '',
    reminderSent: false,
  });

  complaint.timeline.push({
    action:    `Hearing Scheduled: ${hearingDate.toLocaleDateString('en-IN')}`,
    remark:    result.data.notes || '',
    changedBy: new Types.ObjectId(req.user!.id),
    at:        new Date(),
  });

  await complaint.save();

  return successResponse(res, { hearingDates: complaint.hearingDates }, 'Hearing date added');
});

// ── 8. Generate Public Tracking Token ────────────────────────────────────────

export const generatePublicToken = asyncHandler(async (
  req: AuthRequest, res: Response, next: NextFunction
) => {
  const complaint = await getComplaintOrFail(req.params.id, next);
  if (!complaint) return;

  if (!canAccessComplaint(complaint, req.user!.id, req.user!.role)) {
    return next(createError('Access denied', 403));
  }

  // Generate new token if not present
  if (!complaint.publicTrackingToken) {
    complaint.publicTrackingToken = generateTrackingToken();
    await complaint.save();
  }

  const trackingUrl = `${process.env.CLIENT_URL}/track/${complaint.publicTrackingToken}`;

  return successResponse(res, {
    trackingToken: complaint.publicTrackingToken,
    trackingUrl,
  }, 'Public tracking token generated');
});

// ── 9. Public Track (No Auth) ─────────────────────────────────────────────────

export const publicTrack = asyncHandler(async (
  req: Request, res: Response, next: NextFunction
) => {
  const { token } = req.params;

  const complaint = await Complaint.findOne({ publicTrackingToken: token })
    .select('complaintId title category status caseStage timeline hearingDates createdAt updatedAt')
    .lean();

  if (!complaint) {
    return next(createError('Invalid or expired tracking link', 404));
  }

  return successResponse(res, { complaint }, 'Complaint tracked');
});

// ── 10. Get Complaint Stats (Admin Dashboard) ─────────────────────────────────

export const getStats = asyncHandler(async (
  req: AuthRequest, res: Response
) => {
  const filter: Record<string, unknown> = {};
  if (req.user!.role === 'user')   filter.createdBy      = req.user!.id;
  if (req.user!.role === 'lawyer') filter.assignedLawyer = req.user!.id;

  const [statusCounts, stageCounts, categoryCounts, total] = await Promise.all([
    Complaint.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Complaint.aggregate([
      { $match: filter },
      { $group: { _id: '$caseStage', count: { $sum: 1 } } },
    ]),
    Complaint.aggregate([
      { $match: filter },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    Complaint.countDocuments(filter),
  ]);

  // Monthly trend (last 12 months)
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const monthlyTrend = await Complaint.aggregate([
    { $match: { ...filter, createdAt: { $gte: twelveMonthsAgo } } },
    {
      $group: {
        _id: {
          year:  { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  // Average resolution time (days)
  const avgResolution = await Complaint.aggregate([
    { $match: { ...filter, resolvedAt: { $exists: true } } },
    {
      $group: {
        _id:     null,
        avgDays: {
          $avg: {
            $divide: [
              { $subtract: ['$resolvedAt', '$createdAt'] },
              1000 * 60 * 60 * 24,
            ],
          },
        },
      },
    },
  ]);

  return successResponse(res, {
    total,
    statusCounts,
    stageCounts,
    categoryCounts,
    monthlyTrend,
    avgResolutionDays: avgResolution[0]?.avgDays?.toFixed(1) || '0',
  }, 'Stats fetched');
});

// ── 11. Add Resolution Summary ────────────────────────────────────────────────

export const addResolutionSummary = asyncHandler(async (
  req: AuthRequest, res: Response, next: NextFunction
) => {
  const { summary } = req.body as { summary: string };
  if (!summary || summary.trim().length < 10) {
    return next(createError('Resolution summary must be at least 10 characters'));
  }

  const complaint = await getComplaintOrFail(req.params.id, next);
  if (!complaint) return;

  if (!canModifyComplaint(complaint, req.user!.id, req.user!.role)) {
    return next(createError('Access denied', 403));
  }

  complaint.resolutionSummary = summary.trim();
  complaint.timeline.push({
    action:    'Resolution Summary Added',
    remark:    summary.slice(0, 100) + (summary.length > 100 ? '...' : ''),
    changedBy: new Types.ObjectId(req.user!.id),
    at:        new Date(),
  });
  await complaint.save();

  return successResponse(res, { complaint }, 'Resolution summary saved');
});
