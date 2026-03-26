// path: server/src/controllers/complaintController.ts
// All complaint CRUD operations: create (with AI draft), list, get, update status, delete.

import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { Complaint, ComplaintStatus } from '../models/Complaint';
import { User } from '../models/User';
import { AuditLog } from '../models/AuditLog';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { createUniqueComplaintId } from '../utils/complaintId';
import { generateComplaintDraft } from '../utils/draftGenerator';
import { classify } from '../ml/intentClassifier';
import { sendComplaintCreatedEmail, sendStatusUpdateEmail } from '../services/emailService';

// ── Zod Schemas ──────────────────────────────────────────────────────────────
const CreateComplaintSchema = z.object({
  category:    z.string().min(2).max(100),
  description: z.string().min(20).max(5000),
  priority:    z.enum(['Low','Medium','High','Critical']).optional().default('Medium'),
});

const UpdateStatusSchema = z.object({
  status: z.enum(['Submitted','Under Review','In Progress','Escalated','Resolved','Closed']),
  remark: z.string().max(500).optional().default(''),
});

// ── Create Complaint ──────────────────────────────────────────────────────────
export const createComplaint = async (
  req: AuthRequest, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const parsed = CreateComplaintSchema.safeParse(req.body);
    if (!parsed.success) {
      next(createError(parsed.error.errors.map((e) => e.message).join(', ')));
      return;
    }
    const { category, description, priority } = parsed.data;

    // AI classification
    const aiResult = classify(description);

    // Generate unique complaint ID
    const complaintId = await createUniqueComplaintId();

    // Fetch user name for draft
    const user = await User.findById(req.user!.id);
    const userName = user?.name || 'Complainant';

    // Generate formal draft
    const autoDraft = generateComplaintDraft({
      complaintId, userName, category, description,
      suggestedActs: aiResult.suggestedActs,
    });

    const complaint = await Complaint.create({
      complaintId,
      userId:         req.user!.id,
      category,
      description,
      autoDraft,
      priority,
      status:         'Submitted',
      detectedIntent: aiResult.intent,
      suggestedActs:  aiResult.suggestedActs,
      timeline: [{
        status: 'Submitted',
        by:     req.user!.id,
        remark: 'Complaint submitted by user',
        at:     new Date(),
      }],
    });

    // Audit log
    await AuditLog.create({
      userId:     req.user!.id,
      action:     'complaint_create',
      entityType: 'Complaint',
      entityId:   complaintId,
      ip:         req.ip,
    });

    // Email notification (fire-and-forget — don't let email failure block response)
    sendComplaintCreatedEmail(user?.email || '', complaintId, category).catch(console.error);

    res.status(201).json({ success: true, complaint, aiResult });
  } catch (err) {
    next(err);
  }
};

// ── Get Complaint by ID ───────────────────────────────────────────────────────
export const getComplaint = async (
  req: AuthRequest, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const complaint = await Complaint.findOne({ complaintId: req.params.id })
      .populate('userId', 'name email');

    if (!complaint) { next(createError('Complaint not found', 404)); return; }

    // Non-admins can only view their own complaints
    const complainantId = (complaint.userId as any)._id ? (complaint.userId as any)._id.toString() : complaint.userId.toString();
    const isOwner = complainantId === req.user!.id;
    const isPrivileged = ['admin','lawyer'].includes(req.user!.role);
    if (!isOwner && !isPrivileged) {
      next(createError('Access denied', 403)); return;
    }

    res.json({ success: true, complaint });
  } catch (err) {
    next(err);
  }
};

// ── List Complaints ───────────────────────────────────────────────────────────
export const listComplaints = async (
  req: AuthRequest, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const { status, category, page = '1', limit = '20' } = req.query as Record<string, string>;
    const pageNum  = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip     = (pageNum - 1) * limitNum;

    // Build filter: users see only their own, admins/lawyers see all
    const filter: Record<string, unknown> = {};
    if (!['admin','lawyer'].includes(req.user!.role)) {
      filter.userId = req.user!.id;
    }
    if (status)   filter.status   = status;
    if (category) filter.category = { $regex: category, $options: 'i' };

    const [complaints, total] = await Promise.all([
      Complaint.find(filter)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Complaint.countDocuments(filter),
    ]);

    res.json({ success: true, complaints, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (err) {
    next(err);
  }
};

// ── Update Status (admin / lawyer) ────────────────────────────────────────────
export const updateStatus = async (
  req: AuthRequest, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const parsed = UpdateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      next(createError(parsed.error.errors.map((e) => e.message).join(', ')));
      return;
    }
    const { status, remark } = parsed.data;

    const complaint = await Complaint.findOne({ complaintId: req.params.id });
    if (!complaint) { next(createError('Complaint not found', 404)); return; }

    complaint.status = status as ComplaintStatus;
    complaint.timeline.push({ status: status as ComplaintStatus, by: req.user!.id as unknown as import('mongoose').Types.ObjectId, remark: remark || '', at: new Date() });
    await complaint.save();

    // Audit log
    await AuditLog.create({
      userId: req.user!.id, action: 'status_update',
      entityType: 'Complaint', entityId: complaint.complaintId,
      meta: { newStatus: status }, ip: req.ip,
    });

    // Notify complainant
    const owner = await User.findById(complaint.userId);
    if (owner?.email) {
      sendStatusUpdateEmail(owner.email, complaint.complaintId, status).catch(console.error);
    }

    res.json({ success: true, complaint });
  } catch (err) {
    next(err);
  }
};

// ── Delete (admin only) ───────────────────────────────────────────────────────
export const deleteComplaint = async (
  req: AuthRequest, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const complaint = await Complaint.findOneAndDelete({ complaintId: req.params.id });
    if (!complaint) { next(createError('Complaint not found', 404)); return; }
    res.json({ success: true, message: `Complaint ${req.params.id} deleted` });
  } catch (err) {
    next(err);
  }
};

// ── Get Draft Text ─────────────────────────────────────────────────────────────
export const getDraft = async (
  req: AuthRequest, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const complaint = await Complaint.findOne({ complaintId: req.params.id });
    if (!complaint) { next(createError('Complaint not found', 404)); return; }

    const isOwner      = complaint.userId.toString() === req.user!.id;
    const isPrivileged = ['admin','lawyer'].includes(req.user!.role);
    if (!isOwner && !isPrivileged) { next(createError('Access denied', 403)); return; }

    res.json({ success: true, draft: complaint.autoDraft });
  } catch (err) {
    next(err);
  }
};
