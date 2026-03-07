// path: server/src/utils/complaintId.ts
// Generates unique, human-readable complaint IDs.
// Format: NV-YYYYMMDD-XXXX  (e.g. NV-20260301-A3F7)
// Retries up to 5 times on collision (extremely rare but handled).

import { Complaint } from '../models/Complaint';

function randomSuffix(len = 4): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No ambiguous chars (0,O,1,I)
  let result  = '';
  for (let i = 0; i < len; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function todayStamp(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

export async function generateComplaintId(maxRetries = 5): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const id = `NV-${todayStamp()}-${randomSuffix(4)}`;
    const exists = await Complaint.exists({ complaintId: id });
    if (!exists) return id;
    if (attempt === maxRetries) {
      // Extremely unlikely — fall back to timestamp-based ID
      return `NV-${Date.now()}-${randomSuffix(4)}`;
    }
  }
  return `NV-${Date.now()}-${randomSuffix(4)}`;
}
