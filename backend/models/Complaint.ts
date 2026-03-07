/*
// Add these optional fields to your Complaint Mongoose schema:

aiRiskScore   : { type: Number, min: 0, max: 100 },
aiRiskLevel   : { type: String, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
aiAnalyzedAt  : { type: Date },

// And to your IComplaint interface:
aiRiskScore?  : number;
aiRiskLevel?  : "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
aiAnalyzedAt? : Date;
*/
