/*
import React from "react";

interface SimilarComplaint {
  complaintId: string;
  title: string;
  description: string;
  department: string;
  status: string;
  similarityScore: number;
}

interface AIAnalysis {
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  prioritySuggestion: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  departmentSuggestion: string;
  similarComplaints: SimilarComplaint[];
  keywords: string[];
  analysisReason: string;
}

interface AIResultCardProps {
  analysis: AIAnalysis;
  loading?: boolean;
}

const RISK_COLORS: Record<string, string> = {
  LOW: "#22c55e",
  MEDIUM: "#f59e0b",
  HIGH: "#f97316",
  CRITICAL: "#ef4444",
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "#6b7280",
  MEDIUM: "#3b82f6",
  HIGH: "#f97316",
  URGENT: "#ef4444",
};

const RiskMeter: React.FC<{ score: number; level: string }> = ({ score, level }) => {
  const color = RISK_COLORS[level] || "#6b7280";
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: "#374151" }}>Risk Score</span>
        <span style={{ fontWeight: 700, fontSize: 15, color }}>
          {score}/100 — {level}
        </span>
      </div>
      <div
        style={{
          height: 10,
          borderRadius: 999,
          background: "#e5e7eb",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${score}%`,
            background: color,
            borderRadius: 999,
            transition: "width 0.6s ease",
          }}
        />
      </div>
    </div>
  );
};

export const AIResultCard: React.FC<AIResultCardProps> = ({
  analysis,
  loading = false,
}) => {
  if (loading) {
    return (
      <div
        style={{
          padding: 24,
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          background: "#f9fafb",
          textAlign: "center",
          color: "#6b7280",
        }}
      >
        <div
          style={{
            display: "inline-block",
            width: 24,
            height: 24,
            border: "3px solid #6366f1",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            marginBottom: 8,
          }}
        />
        <p style={{ margin: 0, fontSize: 14 }}>Analyzing complaint with AI…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const priorityColor = PRIORITY_COLORS[analysis.prioritySuggestion] || "#6b7280";

  return (
    <div
      style={{
        padding: 24,
        border: "1.5px solid #6366f1",
        borderRadius: 12,
        background: "#fafafa",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 20, gap: 10 }}>
        <span style={{ fontSize: 22 }}>🤖</span>
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1f2937" }}>
          AI Case Intelligence
        </h3>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 11,
            background: "#ede9fe",
            color: "#6366f1",
            padding: "2px 10px",
            borderRadius: 999,
            fontWeight: 600,
          }}
        >
          LOCAL MODEL
        </span>
      </div>

      {/* Risk Meter */}
      <RiskMeter score={analysis.riskScore} level={analysis.riskLevel} />

      {/* Priority + Department */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div
          style={{
            flex: 1,
            minWidth: 140,
            padding: "10px 14px",
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
          }}
        >
          <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>
            PRIORITY SUGGESTION
          </div>
          <div style={{ fontWeight: 700, color: priorityColor, fontSize: 15 }}>
            {analysis.prioritySuggestion}
          </div>
        </div>
        <div
          style={{
            flex: 1,
            minWidth: 140,
            padding: "10px 14px",
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
          }}
        >
          <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>
            DEPT. SUGGESTION
          </div>
          <div style={{ fontWeight: 700, color: "#1f2937", fontSize: 13 }}>
            {analysis.departmentSuggestion}
          </div>
        </div>
      </div>

      {/* Keywords */}
      {analysis.keywords.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
            Key Terms
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {analysis.keywords.map((kw) => (
              <span
                key={kw}
                style={{
                  fontSize: 12,
                  background: "#ede9fe",
                  color: "#6366f1",
                  padding: "3px 10px",
                  borderRadius: 999,
                  fontWeight: 500,
                }}
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Reason */}
      <div
        style={{
          marginBottom: 16,
          padding: 12,
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: 8,
          fontSize: 13,
          color: "#166534",
          lineHeight: 1.6,
        }}
      >
        {analysis.analysisReason}
      </div>

      {/* Similar Complaints */}
      {analysis.similarComplaints.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 10 }}>
            Similar Past Complaints ({analysis.similarComplaints.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {analysis.similarComplaints.map((sc) => (
              <div
                key={sc.complaintId}
                style={{
                  padding: 12,
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>
                    {sc.title}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                    {sc.description}
                  </div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
                    {sc.department} · Status: {sc.status}
                  </div>
                </div>
                <div
                  style={{
                    flexShrink: 0,
                    background:
                      sc.similarityScore >= 70
                        ? "#fef2f2"
                        : sc.similarityScore >= 40
                        ? "#fff7ed"
                        : "#f0fdf4",
                    color:
                      sc.similarityScore >= 70
                        ? "#ef4444"
                        : sc.similarityScore >= 40
                        ? "#f97316"
                        : "#22c55e",
                    fontWeight: 700,
                    fontSize: 13,
                    padding: "4px 10px",
                    borderRadius: 8,
                  }}
                >
                  {sc.similarityScore}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.similarComplaints.length === 0 && (
        <div
          style={{
            fontSize: 13,
            color: "#6b7280",
            textAlign: "center",
            padding: 12,
            border: "1px dashed #d1d5db",
            borderRadius: 8,
          }}
        >
          No similar complaints found in the database.
        </div>
      )}
    </div>
  );
};

export default AIResultCard;
*/
