// path: server/src/utils/complaintId.ts
// Generates a unique human-readable complaint ID: NV-<timestamp>-<rand4>
// Retries up to 5 times to guarantee uniqueness in the DB.

import { Complaint } from '../models/Complaint';

function generateId(): string {
  const ts   = Date.now();
  const rand = Math.floor(1000 + Math.random() * 9000); // 4-digit
  return `NV-${ts}-${rand}`;
}

export async function createUniqueComplaintId(maxRetries = 5): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    const id = generateId();
    const exists = await Complaint.findOne({ complaintId: id });
    if (!exists) return id;
  }
  throw new Error('Could not generate a unique complaint ID after multiple attempts');
}
