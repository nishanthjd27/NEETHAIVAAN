// path: server/src/seed.ts
// Seeds database with demo data for development and testing.

import dotenv from "dotenv";
dotenv.config();

import mongoose  from "mongoose";
import bcrypt    from "bcryptjs";
import { User }       from "./models/User";
import { Complaint }  from "./models/Complaint";
import { AuditLog }   from "./models/AuditLog";
import { ENV }        from "./config/env";

const CATEGORIES = [
  "Consumer Fraud",
  "Cyber Crime",
  "Labour Dispute",
  "Property Dispute",
  "Police Complaint",
  "Domestic Violence",
];

async function seed() {
  await mongoose.connect(ENV.MONGODB_URI);
  console.log("Connected to MongoDB");

  // Clear existing
  await Promise.all([
    User.deleteMany({}),
    Complaint.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);
  console.log("Cleared existing data");

  const salt = ENV.BCRYPT_SALT_ROUNDS;

  // Create users
  const [admin, lawyer, user1] = await User.create([
    {
      name: "Admin User",
      email: "admin@neethivaan.test",
      password: await bcrypt.hash("AdminPass123!", salt),
      role: "admin",
      isVerified: true,
    },
    {
      name: "Advocate Priya",
      email: "lawyer@neethivaan.test",
      password: await bcrypt.hash("LawyerPass123!", salt),
      role: "lawyer",
      isVerified: true,
    },
    {
      name: "Ravi Kumar",
      email: "user@neethivaan.test",
      password: await bcrypt.hash("UserPass123!", salt),
      role: "user",
      isVerified: true,
    },
  ]);
  console.log("Created users");

  // Create complaints
  const now = new Date();
  const complaints = await Complaint.create([
    {
      complaintId: "NV-20260301-AA01",
      publicTrackingToken: "demo-token-consumer-fraud-001",
      title: "Online Shopping Fraud - Received Counterfeit Product",
      description: "I ordered a branded mobile phone worth Rs 45000 from an online marketplace. The product delivered was a cheap counterfeit. The seller is not responding and the platform is refusing refund.",
      category: "Consumer Fraud",
      status: "Under Review",
      priority: "High",
      caseStage: "Investigation",
      createdBy: user1._id,
      assignedLawyer: lawyer._id,
      detectedIntent: "consumer_fraud",
      suggestedActs: ["Consumer Protection Act 2019", "IT Act 2000"],
      hearingDates: [{ date: new Date(now.getTime() + 7 * 24*60*60*1000), venue: "Consumer Court Chennai", notes: "First hearing", reminderSent: false }],
      timeline: [
        { action: "Complaint Filed", remark: "Filed by user", changedBy: user1._id, at: new Date(now.getTime() - 5*24*60*60*1000) },
        { action: "Status: Submitted -> Under Review", remark: "Assigned to Advocate Priya", changedBy: admin._id, at: new Date(now.getTime() - 3*24*60*60*1000) },
        { action: "Stage: Filed -> Investigation", remark: "Evidence collection started", changedBy: lawyer._id, at: new Date(now.getTime() - 1*24*60*60*1000) },
      ],
    },
    {
      complaintId: "NV-20260301-BB02",
      publicTrackingToken: "demo-token-labour-dispute-002",
      title: "Salary Not Paid for 3 Months",
      description: "My employer has not paid salary for 3 months despite repeated requests. I work as software engineer at XYZ Technologies. The company owes me Rs 1,50,000 in unpaid wages.",
      category: "Labour Dispute",
      status: "Submitted",
      priority: "High",
      caseStage: "Filed",
      createdBy: user1._id,
      suggestedActs: ["Payment of Wages Act 1936", "Industrial Disputes Act 1947"],
      timeline: [
        { action: "Complaint Filed", remark: "Filed by user", changedBy: user1._id, at: new Date(now.getTime() - 2*24*60*60*1000) },
      ],
    },
    {
      complaintId: "NV-20260301-CC03",
      publicTrackingToken: "demo-token-cyber-crime-003",
      title: "UPI Fraud - Unauthorized Money Transfer",
      description: "Received a call from a scammer posing as bank employee. They got OTP and transferred Rs 25,000 from my account via UPI. Transaction ID: UPI123456789.",
      category: "Cyber Crime",
      status: "Resolved",
      priority: "Critical",
      caseStage: "Closed",
      createdBy: user1._id,
      assignedLawyer: lawyer._id,
      resolutionSummary: "Amount recovered through bank dispute resolution. FIR filed with Cyber Cell. Accused identified.",
      resolvedAt: new Date(now.getTime() - 1*24*60*60*1000),
      suggestedActs: ["IT Act 2000 Section 66D", "IPC Section 420"],
      timeline: [
        { action: "Complaint Filed", remark: "Filed by user", changedBy: user1._id, at: new Date(now.getTime() - 10*24*60*60*1000) },
        { action: "Status: Submitted -> Resolved", remark: "Bank reversed transaction", changedBy: admin._id, at: new Date(now.getTime() - 1*24*60*60*1000) },
        { action: "Stage: Filed -> Closed", remark: "Case closed successfully", changedBy: lawyer._id, at: new Date(now.getTime() - 1*24*60*60*1000) },
      ],
    },
    {
      complaintId: "NV-20260301-DD04",
      publicTrackingToken: "demo-token-property-004",
      title: "Landlord Refusing Security Deposit Refund",
      description: "Vacated rented apartment 2 months ago. Landlord refusing to return Rs 60,000 security deposit without valid reason. Property at Anna Nagar, Chennai.",
      category: "Property Dispute",
      status: "Escalated",
      priority: "Medium",
      caseStage: "Hearing",
      createdBy: user1._id,
      assignedLawyer: lawyer._id,
      hearingDates: [
        { date: new Date(now.getTime() + 3*24*60*60*1000), venue: "Rent Control Court", notes: "Mediation hearing", reminderSent: false },
      ],
      suggestedActs: ["Transfer of Property Act 1882", "Tamil Nadu Buildings Lease and Rent Control Act"],
      timeline: [
        { action: "Complaint Filed", remark: "Filed", changedBy: user1._id, at: new Date(now.getTime() - 15*24*60*60*1000) },
        { action: "Stage: Filed -> Hearing", remark: "Escalated to court", changedBy: lawyer._id, at: new Date(now.getTime() - 5*24*60*60*1000) },
      ],
    },
  ]);
  console.log("Created " + complaints.length + " complaints");

  console.log("");
  console.log("SEED COMPLETE!");
  console.log("----------------------------------------------");
  console.log("Admin:   admin@neethivaan.test  / AdminPass123!");
  console.log("Lawyer:  lawyer@neethivaan.test / LawyerPass123!");
  console.log("User:    user@neethivaan.test   / UserPass123!");
  console.log("----------------------------------------------");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
