/*
import { Request, Response } from "express";
import Complaint from "../models/Complaint";
import { analyzeComplaint, AIAnalysisResult } from "../services/aiService";

/**
 * POST /api/ai/analyze/:complaintId
 * Admin-only route — JWT + role guard applied in aiRoutes.ts
 * /
export const analyzeCase = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { complaintId } = req.params;

    if (!complaintId) {
      res.status(400).json({ success: false, message: "Complaint ID is required." });
      return;
    }

    // 1. Fetch the target complaint
    const targetComplaint = await Complaint.findById(complaintId).lean();
    if (!targetComplaint) {
      res.status(404).json({ success: false, message: "Complaint not found." });
      return;
    }

    // 2. Fetch corpus for similarity search (last 500 for performance)
    const allComplaints = await Complaint.find({})
      .select("_id title description department status")
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    // 3. Run local AI analysis — zero API calls, 100% free
    const result: AIAnalysisResult = analyzeComplaint(
      targetComplaint as any,
      allComplaints as any
    );

    // 4. Persist AI scores back to the complaint document
    await Complaint.findByIdAndUpdate(complaintId, {
      aiRiskScore: result.riskScore,
      aiRiskLevel: result.riskLevel,
      aiAnalyzedAt: new Date(),
    });

    res.status(200).json({ success: true, complaintId, analysis: result });
  } catch (error: any) {
    console.error("[AI Analyze Error]", error);
    res.status(500).json({
      success: false,
      message: "AI analysis failed. Please try again.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
*/
