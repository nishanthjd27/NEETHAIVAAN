/*
// ── Add these imports at top ──────────────────────────────────────
import { useState } from "react";
import AIResultCard from "../../components/AIResultCard";
import axios from "axios";

// ── Add inside your component function ───────────────────────────
const [aiLoading, setAiLoading] = useState(false);
const [aiResult, setAiResult] = useState<any>(null);
const [aiError, setAiError] = useState<string | null>(null);

const handleAnalyzeCase = async () => {
  setAiLoading(true);
  setAiError(null);
  setAiResult(null);
  try {
    const token = localStorage.getItem("token"); // or your auth store
    const { data } = await axios.post(
      `/api/ai/analyze/${complaint._id}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setAiResult(data.analysis);
  } catch (err: any) {
    setAiError(
      err?.response?.data?.message || "Analysis failed. Please try again."
    );
  } finally {
    setAiLoading(false);
  }
};

// ── Add this button in your JSX (near status/priority controls) ───
<button
  onClick={handleAnalyzeCase}
  disabled={aiLoading}
  style={{
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "9px 18px",
    background: aiLoading ? "#a5b4fc" : "#6366f1",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
    cursor: aiLoading ? "not-allowed" : "pointer",
    transition: "background 0.2s",
  }}
>
  {aiLoading ? "⏳ Analyzing…" : "🤖 Analyze Case"}
</button>

// ── Render AI result card below the complaint details ─────────────
{(aiLoading || aiResult) && (
  <div style={{ marginTop: 24 }}>
    <AIResultCard analysis={aiResult} loading={aiLoading} />
  </div>
)}

{aiError && (
  <div
    style={{
      marginTop: 12,
      padding: "10px 16px",
      background: "#fef2f2",
      border: "1px solid #fecaca",
      borderRadius: 8,
      color: "#dc2626",
      fontSize: 13,
    }}
  >
    {aiError}
  </div>
)}
*/
