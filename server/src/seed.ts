// path: server/src/seed.ts
// Database seeder. Run: npm run seed
// Creates admin + regular user accounts and 4 sample complaints.
// ⚠️  Change passwords before deploying to production!

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from './models/User';
import { Complaint } from './models/Complaint';
import { createUniqueComplaintId } from './utils/complaintId';
import { generateComplaintDraft } from './utils/draftGenerator';

dotenv.config();

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

const SEED_USERS = [
  {
    name:     'Admin User',
    email:    'admin@neethivaan.test',
    password: 'AdminPass123!',
    role:     'admin' as const,
  },
  {
    name:     'Regular User',
    email:    'user@neethivaan.test',
    password: 'UserPass123!',
    role:     'user' as const,
  },
];

const SEED_COMPLAINTS = [
  {
    category:    'Consumer Fraud',
    description: 'I purchased a mobile phone online but received a defective product. The seller refused to process my refund despite multiple follow-ups.',
    status:      'Submitted' as const,
    priority:    'High' as const,
  },
  {
    category:    'Labour Dispute',
    description: 'My employer has not paid my salary for the last three months. All attempts to contact HR have been ignored.',
    status:      'Under Review' as const,
    priority:    'Critical' as const,
  },
  {
    category:    'Tenant Rights',
    description: 'My landlord is refusing to return my security deposit of Rs 50,000 after I vacated the property as per the agreed terms.',
    status:      'In Progress' as const,
    priority:    'Medium' as const,
  },
  {
    category:    'Corruption Report',
    description: 'A government officer demanded a bribe of Rs 5,000 to process my passport application. I have documented evidence.',
    status:      'Resolved' as const,
    priority:    'High' as const,
  },
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI not set'); process.exit(1); }

  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');

  // Clear existing seed data
  await Promise.all([
    User.deleteMany({ email: { $in: SEED_USERS.map((u) => u.email) } }),
    Complaint.deleteMany({ category: { $in: SEED_COMPLAINTS.map((c) => c.category) } }),
  ]);

  // Create users
  const createdUsers: Array<{ id: string; email: string }> = [];
  for (const u of SEED_USERS) {
    const hash = await bcrypt.hash(u.password, SALT_ROUNDS);
    const user = await User.create({ ...u, password: hash });
    createdUsers.push({ id: user.id, email: user.email });
    console.log(`  👤 Created ${u.role}: ${u.email} / ${u.password}`);
  }

  const regularUser = createdUsers.find((u) => u.email === 'user@neethivaan.test')!;
  const adminUser   = createdUsers.find((u) => u.email === 'admin@neethivaan.test')!;

  // Create complaints
  for (const c of SEED_COMPLAINTS) {
    const complaintId = await createUniqueComplaintId();
    const autoDraft   = generateComplaintDraft({
      complaintId, userName: 'Regular User',
      category: c.category, description: c.description,
    });

    await Complaint.create({
      complaintId,
      userId:   regularUser.id,
      ...c,
      autoDraft,
      timeline: [
        { status: 'Submitted',     by: regularUser.id, remark: 'Complaint submitted', at: new Date(Date.now() - 7 * 86400000) },
        ...(c.status !== 'Submitted' ? [{ status: c.status, by: adminUser.id, remark: 'Status updated by admin', at: new Date() }] : []),
      ],
    });
    console.log(`  📋 Created complaint: ${complaintId} [${c.status}] – ${c.category}`);
  }

  console.log('\n🎉 Seed complete!');
  console.log('─────────────────────────────────────────────');
  console.log('Admin:   admin@neethivaan.test / AdminPass123!');
  console.log('User:    user@neethivaan.test  / UserPass123!');
  console.log('─────────────────────────────────────────────');
  await mongoose.disconnect();
}

seed().catch((err) => { console.error('Seed failed:', err); process.exit(1); });
