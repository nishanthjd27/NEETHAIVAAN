// path: server/src/controllers/analyticsController.ts
// MongoDB aggregation pipelines for dashboard analytics.
// All endpoints require admin role.

import { Request, Response, NextFunction } from 'express';
import { Complaint } from '../models/Complaint';
import { AuditLog } from '../models/AuditLog';

// ── Status Counts ─────────────────────────────────────────────────────────────
// Returns: [{ status: 'Submitted', count: 12 }, ...]
export const getStatusCounts = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await Complaint.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { _id: 0, status: '$_id', count: 1 } },
      { $sort: { count: -1 } },
    ]);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ── Monthly Trends ────────────────────────────────────────────────────────────
// Returns: [{ year: 2024, month: 1, count: 8 }, ...] last 12 months
export const getMonthlyTrends = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const data = await Complaint.aggregate([
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
      {
        $project: {
          _id: 0,
          year:  '$_id.year',
          month: '$_id.month',
          count: 1,
        },
      },
      { $sort: { year: 1, month: 1 } },
    ]);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ── Average Resolution Time ────────────────────────────────────────────────────
// Returns average days from Submitted to Resolved per category
export const getAvgResolutionTime = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await Complaint.aggregate([
      { $match: { status: { $in: ['Resolved', 'Closed'] } } },
      {
        $addFields: {
          resolutionDays: {
            $divide: [
              { $subtract: ['$updatedAt', '$createdAt'] },
              1000 * 60 * 60 * 24, // ms → days
            ],
          },
        },
      },
      {
        $group: {
          _id:            '$category',
          avgDays:        { $avg: '$resolutionDays' },
          totalResolved:  { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          category:      '$_id',
          avgDays:       { $round: ['$avgDays', 1] },
          totalResolved: 1,
        },
      },
      { $sort: { avgDays: 1 } },
    ]);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ── Audit Logs ────────────────────────────────────────────────────────────────
export const getAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = '1', limit = '50' } = req.query as Record<string, string>;
    const pageNum  = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10)));

    const logs = await AuditLog.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const total = await AuditLog.countDocuments();
    res.json({ success: true, logs, total });
  } catch (err) {
    next(err);
  }
};
