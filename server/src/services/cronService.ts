// path: server/src/services/cronService.ts
// Scheduled job: auto-escalate stale "Submitted" complaints every day at 2 AM.
// Days threshold configurable via AUTO_ESCALATE_DAYS env var (default: 5).

import cron from 'node-cron';
import { Complaint } from '../models/Complaint';
import { AuditLog } from '../models/AuditLog';

export function startEscalationCron(): void {
  const escalateDays = parseInt(process.env.AUTO_ESCALATE_DAYS || '5', 10);

  // Run every day at 2:00 AM server time: '0 2 * * *'
  // For demo / quick testing, use '* * * * *' (every minute)
  cron.schedule('0 2 * * *', async () => {
    console.log('[Cron] Running auto-escalation check...');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - escalateDays);

    try {
      const stale = await Complaint.find({
        status:    'Submitted',
        createdAt: { $lt: cutoffDate },
      });

      if (stale.length === 0) {
        console.log('[Cron] No stale complaints to escalate');
        return;
      }

      // A system user ID placeholder — use the admin user's _id in production
      const SYSTEM_ID = '000000000000000000000000';

      for (const complaint of stale) {
        complaint.status = 'Escalated';
        complaint.timeline.push({
          status: 'Escalated',
          by:     SYSTEM_ID as unknown as import('mongoose').Types.ObjectId,
          remark: `Auto-escalated: no action for ${escalateDays} days`,
          at:     new Date(),
        });
        await complaint.save();

        await AuditLog.create({
          action:     'auto_escalate',
          entityType: 'Complaint',
          entityId:   complaint.complaintId,
          meta:       { escalateDays },
        });
      }

      console.log(`[Cron] ✅ Escalated ${stale.length} complaint(s)`);
    } catch (err) {
      console.error('[Cron] Escalation error:', err);
    }
  });

  console.log(`[Cron] Auto-escalation scheduled (threshold: ${escalateDays} days, runs at 2 AM daily)`);
}
