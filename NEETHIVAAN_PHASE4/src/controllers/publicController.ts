import { Request, Response } from "express";
import Complaint from "../models/Complaint";
import { hashTrackingToken } from "../utils/trackingToken";

/**
 * GET /api/public/track/:token
 *
 * Citizen-facing endpoint — NO authentication required.
 *
 * Flow:
 *  1. Accept raw token from URL param
 *  2. Hash it with SHA-256
 *  3. Look up Complaint by publicTrackingTokenHash
 *  4. Return only citizen-safe fields (no officer/internal data)
 */
export const trackComplaint = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token } = req.params;

    // ── Validation ────────────────────────────────────────────────────────
    if (!token || typeof token !== "string" || token.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: "A valid tracking token is required.",
      });
      return;
    }

    if (token.trim().length !== 64) {
      res.status(400).json({
        success: false,
        message: "Invalid tracking token format.",
      });
      return;
    }
    // ──────────────────────────────────────────────────────────────────────

    const tokenHash = hashTrackingToken(token);

    const complaint = await Complaint.findOne({
      publicTrackingTokenHash: tokenHash,
    }).select(
      // Expose ONLY citizen-safe fields — assignedTo / officer remarks excluded
      "ticketNumber category description location district status priority " +
      "department remarks statusHistory resolvedAt createdAt updatedAt"
    );

    if (!complaint) {
      res.status(404).json({
        success: false,
        message:
          "No complaint found for the provided tracking token. " +
          "Please verify your token and try again.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Complaint details retrieved successfully.",
      data: {
        ticketNumber:  complaint.ticketNumber,
        category:      complaint.category,
        description:   complaint.description,
        location:      complaint.location,
        district:      complaint.district,
        status:        complaint.status,
        priority:      complaint.priority,
        department:    complaint.department  ?? null,
        remarks:       complaint.remarks     ?? null,
        statusHistory: complaint.statusHistory,
        resolvedAt:    complaint.resolvedAt  ?? null,
        filedAt:       complaint.createdAt,
        lastUpdated:   complaint.updatedAt,
      },
    });
  } catch (error) {
    console.error("[publicController.trackComplaint] Error:", error);
    res.status(500).json({
      success: false,
      message: "An internal server error occurred. Please try again later.",
    });
  }
};
