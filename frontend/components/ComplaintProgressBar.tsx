import React, { useEffect, useState } from "react";
import { subscribeToComplaint, unsubscribeFromComplaint, onStatusChange } from "../services/socket";

type ComplaintStatus = "pending" | "in_progress" | "escalated" | "resolved" | "rejected";

const STEPS: { key: ComplaintStatus | string; label: string; icon: string }[] = [
  { key: "pending",     label: "Submitted",  icon: "📋" },
  { key: "in_progress", label: "In Review",  icon: "🔍" },
  { key: "escalated",   label: "Escalated",  icon: "⚡" },
  { key: "resolved",    label: "Resolved",   icon: "✅" },
];

const stepIndex = (status: string): number => {
  const map: Record<string, number> = {
    pending: 0, in_progress: 1, escalated: 2, resolved: 3, closed: 3,
  };
  return map[status] ?? 0;
};

interface ComplaintProgressBarProps {
  complaintId:   string;
  initialStatus: string;
  ticketNumber:  string;
}

const ComplaintProgressBar: React.FC<ComplaintProgressBarProps> = ({
  complaintId, initialStatus, ticketNumber,
}) => {
  const [currentStatus, setCurrentStatus] = useState(initialStatus);
  const [animating,     setAnimating]     = useState(false);
  const activeStep = stepIndex(currentStatus);
  const isRejected = currentStatus === "rejected";

  useEffect(() => {
    subscribeToComplaint(complaintId);

    const off = onStatusChange((payload) => {
      if (payload.complaintId === complaintId) {
        setAnimating(true);
        setTimeout(() => {
          setCurrentStatus(payload.newStatus);
          setAnimating(false);
        }, 300);
      }
    });

    return () => {
      unsubscribeFromComplaint(complaintId);
      off();
    };
  }, [complaintId]);

  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    pending:     { bg:"#fef3c7", text:"#92400e", border:"#fcd34d" },
    in_progress: { bg:"#dbeafe", text:"#1e40af", border:"#93c5fd" },
    escalated:   { bg:"#fce7f3", text:"#9d174d", border:"#f9a8d4" },
    resolved:    { bg:"#d1fae5", text:"#065f46", border:"#6ee7b7" },
    closed:      { bg:"#f3f4f6", text:"#374151", border:"#d1d5db" },
    rejected:    { bg:"#fee2e2", text:"#991b1b", border:"#fca5a5" },
  };
  const badge = statusColors[currentStatus] ?? statusColors.pending;

  return (
    <div style={{
      background: "#fff", borderRadius: "16px",
      border: "1px solid #e5e7eb", padding: "24px 28px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      opacity: animating ? 0.6 : 1,
      transition: "opacity 0.3s ease",
    }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"24px" }}>
        <div>
          <div style={{ fontSize:"13px", color:"#6b7280", marginBottom:"2px" }}>Complaint Tracking</div>
          <div style={{ fontSize:"16px", fontWeight:700, color:"#111827" }}>{ticketNumber}</div>
        </div>
        <span style={{
          padding:"4px 12px", borderRadius:"20px", fontSize:"12px", fontWeight:600,
          background: badge.bg, color: badge.text, border: `1px solid ${badge.border}`,
        }}>
          {currentStatus.replace("_"," ").replace(/\b\w/g, c => c.toUpperCase())}
        </span>
      </div>

      {/* Rejected state */}
      {isRejected ? (
        <div style={{ textAlign:"center", padding:"16px 0", color:"#dc2626" }}>
          <div style={{ fontSize:"36px", marginBottom:"8px" }}>❌</div>
          <div style={{ fontWeight:600, fontSize:"15px" }}>Complaint Rejected</div>
          <div style={{ fontSize:"13px", color:"#9ca3af", marginTop:"4px" }}>
            Please contact the grievance office for more information.
          </div>
        </div>
      ) : (
        <>
          {/* Progress track */}
          <div style={{ position:"relative", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            {/* Background line */}
            <div style={{
              position:"absolute", top:"20px", left:"20px",
              right:"20px", height:"3px", background:"#e5e7eb", zIndex:0,
            }} />
            {/* Active line */}
            <div style={{
              position:"absolute", top:"20px", left:"20px",
              width: activeStep === 0 ? "0%" : `calc(${(activeStep / (STEPS.length - 1)) * 100}% - 0px)`,
              height:"3px", background:"linear-gradient(90deg, #3b82f6, #6366f1)",
              zIndex:1, transition:"width 0.6s cubic-bezier(0.4,0,0.2,1)",
            }} />

            {/* Steps */}
            {STEPS.map((step, idx) => {
              const done    = idx < activeStep;
              const active  = idx === activeStep;
              const pending = idx > activeStep;
              return (
                <div key={step.key} style={{ display:"flex", flexDirection:"column", alignItems:"center", zIndex:2 }}>
                  <div style={{
                    width:"40px", height:"40px", borderRadius:"50%", display:"flex",
                    alignItems:"center", justifyContent:"center", fontSize:"18px",
                    fontWeight:700, transition:"all 0.4s ease",
                    background: done ? "#6366f1" : active ? "#3b82f6" : "#f9fafb",
                    border: `3px solid ${done ? "#6366f1" : active ? "#3b82f6" : "#e5e7eb"}`,
                    boxShadow: active ? "0 0 0 4px rgba(59,130,246,0.2)" : "none",
                    color: (done || active) ? "#fff" : "#9ca3af",
                  }}>
                    {done ? "✓" : step.icon}
                  </div>
                  <div style={{
                    marginTop:"8px", fontSize:"11px", fontWeight: active ? 700 : 500,
                    color: done ? "#6366f1" : active ? "#3b82f6" : "#9ca3af",
                    textAlign:"center", maxWidth:"60px", lineHeight:1.3,
                  }}>
                    {step.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live indicator */}
          <div style={{ display:"flex", alignItems:"center", gap:"6px", marginTop:"20px",
            justifyContent:"flex-end" }}>
            <span style={{ width:"7px", height:"7px", borderRadius:"50%", background:"#22c55e",
              display:"inline-block", animation:"pulse 2s infinite" }} />
            <span style={{ fontSize:"11px", color:"#6b7280" }}>Live tracking enabled</span>
          </div>
        </>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  );
};

export default ComplaintProgressBar;