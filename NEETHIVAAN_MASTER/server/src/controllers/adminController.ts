// path: server/src/controllers/adminController.ts
// Phase 3 — Admin workflow controller.
// All mutations push a structured entry into complaint.history[].
// Every route is admin-only (enforced in adminRoutes.ts).

import { Response, NextFunction } from 'express';
import { Types }                  from 'mongoose';
import { z }                      from 'zod';
import { Complaint }              from '../models/Complaint';
import { User }                   from '../models/User';
import { AuditLog }               from '../models/AuditLog';
import { AuthRequest, ComplaintStatus, CaseStage } from '../types';
import { asyncHandler }           from '../utils/asyncHandler';
import { successResponse, paginatedResponse } from '../utils/response';
import { createError }            from '../middleware/errorHandler';

// ── Validation Schemas ────────────────────────────────────────────────────────

const AssignLawyerSchema = z.object({
  lawyerId: z.string().min(1, 'lawyerId is required'),
});

const UpdateStageSchema = z.object({
  caseStage: z.enum(['Filed', 'Under Review', 'Investigation', 'Hearing', 'Judgment', 'Closed']),
  remark:    z.string().max(500).optional().default(''),
});

const UpdateStatusSchema = z.object({
  status: z.enum([
    'Submitted', 'Under Review', 'In Progress', 'Escalated', 'Resolved', 'Closed',
    'OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED',
  ]),
  remark: z.string().max(500).optional().default(''),
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

// ── 1. GET /api/admin/stats ───────────────────────────────────────────────────

export const getSystemStats = asyncHandler(async (
  _req: AuthRequest, res: Response
) => {
  const [
    totalUsers,
    totalComplaints,
    statusCounts,
    stageCounts,
    priorityCounts,
    categoryCounts,
    recentComplaints,
  ] = await Promise.all([
    // Total users by role
    User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),

    // Total complaints
    Complaint.countDocuments(),

    // Complaints by status
    Complaint.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    // Complaints by caseStage
    Complaint.aggregate([
      { $group: { _id: '$caseStage', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    // Complaints by priority
    Complaint.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    // Top 10 categories
    Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),

    // Last 5 complaints
    Complaint.find()
      .select('complaintId title status caseStage createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ]);

  // Monthly trend (last 12 months)
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const monthlyTrend = await Complaint.aggregate([
    { $match: { createdAt: { $gte: twelveMonthsAgo } } },
    {
      $group: {
        _id: {
          year:  { $year:  '$createdAt' },
          month: { $month: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  // Average resolution time
  const avgResolution = await Complaint.aggregate([
    { $match: { resolvedAt: { $exists: true, $ne: null } } },
    {
      $group: {
        _id: null,
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

  const totalUserCount = (totalUsers as { _id: string; count: number }[])
    .reduce((acc, r) => acc + r.count, 0);

  return successResponse(res, {
    overview: {
      totalUsers:     totalUserCount,
      usersByRole:    totalUsers,
      totalComplaints,
      avgResolutionDays: Number(avgResolution[0]?.avgDays?.toFixed(1) ?? 0),
    },
    complaints: {
      byStatus:   statusCounts,
      byStage:    stageCounts,
      byPriority: priorityCounts,
      byCategory: categoryCounts,
      monthlyTrend,
      recent:     recentComplaints,
    },
  }, 'System stats fetched');
});

// ── 2. GET /api/admin/complaints ──────────────────────────────────────────────

export const getAllComplaints = asyncHandler(async (
  req: AuthRequest, res: Response
) => {
  const {
    status, category, caseStage, priority,
    q, dateFrom, dateTo,
    page  = '1',
    limit = '15',
    sort  = '-createdAt',
  } = req.query as Record<string, string>;

  const pageNum  = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip     = (pageNum - 1) * limitNum;

  const filter: Record<string, unknown> = {};

  if (status)    filter.status    = status;
  if (category)  filter.category  = { $regex: category, $options: 'i' };
  if (caseStage) filter.caseStage = caseStage;
  if (priority)  filter.priority  = priority;

  if (dateFrom || dateTo) {
    const dateFilter: Record<string, Date> = {};
    if (dateFrom) dateFilter.$gte = new Date(dateFrom);
    if (dateTo)   dateFilter.$lte = new Date(dateTo + 'T23:59:59.999Z');
    filter.createdAt = dateFilter;
  }

  if (q?.trim()) {
    filter.$text = { $search: q.trim() };
  }

  const [complaints, total] = await Promise.all([
    Complaint.find(filter)
      .populate('createdBy',      'name email role')
      .populate('assignedLawyer', 'name email role')
      .sort(q?.trim() ? { score: { $meta: 'textScore' } } : sort)
      .skip(skip)
      .limit(limitNum)
      .select('-autoDraft -documents -comments -timeline'),
    Complaint.countDocuments(filter),
  ]);

  return paginatedResponse(res, complaints, total, pageNum, limitNum, 'Complaints fetched');
});

// ── 3. PATCH /api/admin/assign-lawyer/:id ─────────────────────────────────────

export const assignLawyerToComplaint = asyncHandler(async (
  req: AuthRequest, res: Response, next: NextFunction
) => {
  const parsed = AssignLawyerSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(createError(parsed.error.errors.map(e => e.message).join(', ')));
  }

  // Validate lawyer exists and has correct role
  const lawyer = await User.findById(parsed.data.lawyerId).select('name email role isActive');
  if (!lawyer) return next(createError('Lawyer not found', 404));
  if (lawyer.role !== 'lawyer') return next(createError('User is not a lawyer', 400));
  if (!lawyer.isActive) return next(createError('Lawyer account is inactive', 400));

  const complaint = await Complaint.findOne({ complaintId: req.params.id });
  if (!complaint) return next(createError(`Complaint '${req.params.id}' not found`, 404));

  const previousLawyer = complaint.assignedLawyer?.toString() ?? 'None';

  complaint.assignedLawyer = new Types.ObjectId(parsed.data.lawyerId);

  pushHistory(
    complaint,
    `Lawyer assigned: ${lawyer.name} (${lawyer.email}). Previous: ${previousLawyer}`,
    req.user!.id
  );

  // Phase 2 timeline entry (keeps backward compat)
  complaint.timeline.push({
    action:    `Lawyer Assigned: ${lawyer.name}`,
    remark:    `Assigned by admin`,
    changedBy: new Types.ObjectId(req.user!.id),
    at:        new Date(),
  });

  await complaint.save();

  await AuditLog.create({
    userId:     req.user!.id,
    action:     'admin_assign_lawyer',
    entityType: 'Complaint',
    entityId:   complaint.complaintId,
    meta:       { lawyerId: lawyer.id, lawyerName: lawyer.name },
    ip:         req.ip,
  });

  return successResponse(
    res,
    { complaint, assignedLawyer: { id: lawyer.id, name: lawyer.name, email: lawyer.email } },
    `Lawyer '${lawyer.name}' assigned to ${complaint.complaintId}`
  );
});

// ── 4. PATCH /api/admin/update-stage/:id ─────────────────────────────────────

export const updateComplaintStage = asyncHandler(async (
  req: AuthRequest, res: Response, next: NextFunction
) => {
  const parsed = UpdateStageSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(createError(parsed.error.errors.map(e => e.message).join(', ')));
  }

  const complaint = await Complaint.findOne({ complaintId: req.params.id });
  if (!complaint) return next(createError(`Complaint '${req.params.id}' not found`, 404));

  const { caseStage, remark } = parsed.data;
  const prevStage = complaint.caseStage;

  complaint.caseStage = caseStage as CaseStage;

  pushHistory(
    complaint,
    `Case stage updated: ${prevStage} → ${caseStage}${remark ? `. Note: ${remark}` : ''}`,
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
    action:     'admin_update_stage',
    entityType: 'Complaint',
    entityId:   complaint.complaintId,
    meta:       { prevStage, newStage: caseStage, remark },
    ip:         req.ip,
  });

  return successResponse(
    res,
    { complaint },
    `Case stage updated to '${caseStage}'`
  );
});

// ── 5. PATCH /api/admin/update-status/:id ─────────────────────────────────────

export const updateComplaintStatus = asyncHandler(async (
  req: AuthRequest, res: Response, next: NextFunction
) => {
  const parsed = UpdateStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(createError(parsed.error.errors.map(e => e.message).join(', ')));
  }

  const complaint = await Complaint.findOne({ complaintId: req.params.id });
  if (!complaint) return next(createError(`Complaint '${req.params.id}' not found`, 404));

  const { status, remark } = parsed.data;
  const prevStatus = complaint.status;

  complaint.status = status as ComplaintStatus;

  // Auto-set resolvedAt
  if (['Resolved', 'RESOLVED', 'Closed'].includes(status)) {
    complaint.resolvedAt = new Date();
  }

  pushHistory(
    complaint,
    `Status updated: ${prevStatus} → ${status}${remark ? `. Note: ${remark}` : ''}`,
    req.user!.id
  );

  complaint.timeline.push({
    action:    `Status: ${prevStatus} → ${status}`,
    remark:    remark || '',
    changedBy: new Types.ObjectId(req.user!.id),
    at:        new Date(),
  });

  await complaint.save();

  await AuditLog.create({
    userId:     req.user!.id,
    action:     'admin_update_status',
    entityType: 'Complaint',
    entityId:   complaint.complaintId,
    meta:       { prevStatus, newStatus: status, remark },
    ip:         req.ip,
  });

  return successResponse(
    res,
    { complaint },
    `Status updated to '${status}'`
  );
});

// ── 6. GET /api/admin/lawyers ─────────────────────────────────────────────────
// Returns list of all lawyers (for assignment dropdown in frontend)

export const getAllLawyers = asyncHandler(async (
  _req: AuthRequest, res: Response
) => {
  const lawyers = await User.find({ role: 'lawyer', isActive: true })
    .select('name email phone avatar createdAt')
    .sort({ name: 1 });

  return successResponse(res, { lawyers, total: lawyers.length }, 'Lawyers fetched');
});

// ── 7. GET /api/admin/users ───────────────────────────────────────────────────

export const getAllUsers = asyncHandler(async (
  req: AuthRequest, res: Response
) => {
  const {
    role, page = '1', limit = '20',
  } = req.query as Record<string, string>;

  const pageNum  = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, parseInt(limit, 10));
  const skip     = (pageNum - 1) * limitNum;

  const filter: Record<string, unknown> = {};
  if (role) filter.role = role;

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    User.countDocuments(filter),
  ]);

  return paginatedResponse(res, users, total, pageNum, limitNum, 'Users fetched');
});
