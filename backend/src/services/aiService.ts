import natural from "natural";
import { IComplaint } from "../models/Complaint";

const TfIdf = natural.TfIdf;
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

// ─────────────────────────────────────────────
// Type Definitions
// ─────────────────────────────────────────────

export interface SimilarComplaint {
  complaintId: string;
  title: string;
  description: string;
  department: string;
  status: string;
  similarityScore: number; // 0–100
}

export interface AIAnalysisResult {
  riskScore: number;             // 0–100
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  prioritySuggestion: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  departmentSuggestion: string;
  similarComplaints: SimilarComplaint[];
  keywords: string[];
  analysisReason: string;
}

// ─────────────────────────────────────────────
// Keyword Maps
// ─────────────────────────────────────────────

const PRIORITY_KEYWORDS: Record<string, string[]> = {
  URGENT: [
    "death", "murder", "assault", "rape", "violence", "fire", "explosion",
    "emergency", "critical", "kidnap", "abduction", "threat", "bomb",
    "suicide", "attack", "bleeding", "accident", "fatal", "injury",
  ],
  HIGH: [
    "bribe", "corruption", "fraud", "scam", "harassment", "abuse",
    "extortion", "robbery", "theft", "missing", "illegal", "dangerous",
    "blackmail", "poison", "serious", "urgent", "hospital",
  ],
  MEDIUM: [
    "delay", "problem", "issue", "broken", "damage", "complaint", "loss",
    "unfair", "dispute", "cheating", "denied", "refuse", "poor", "waste",
    "negligence", "misconduct",
  ],
  LOW: [
    "suggestion", "feedback", "request", "minor", "small", "inquiry",
    "information", "general", "query", "slow",
  ],
};

const DEPARTMENT_KEYWORDS: Record<string, string[]> = {
  "Police Department": [
    "crime", "theft", "robbery", "assault", "murder", "violence",
    "arrest", "police", "fir", "attack", "harassment", "kidnap", "rape",
    "threat", "illegal", "drugs", "gambling", "fraud", "cheating",
  ],
  "Health Department": [
    "hospital", "doctor", "medicine", "health", "disease", "patient",
    "treatment", "ambulance", "clinic", "nurse", "medical", "injury",
    "blood", "surgery", "poison", "food safety", "epidemic",
  ],
  "Public Works Department": [
    "road", "pothole", "bridge", "construction", "repair", "infrastructure",
    "water", "pipe", "drainage", "sewage", "flood", "electricity",
    "streetlight", "building", "demolish", "encroachment",
  ],
  "Revenue Department": [
    "land", "property", "tax", "patta", "chitta", "encumbrance",
    "registration", "mutation", "survey", "ownership", "deed",
    "tenancy", "rent", "mortgage", "document",
  ],
  "Education Department": [
    "school", "college", "teacher", "student", "education", "syllabus",
    "exam", "scholarship", "fees", "admission", "university", "coaching",
    "tuition", "principal", "headmaster",
  ],
  "Transport Department": [
    "bus", "train", "vehicle", "transport", "traffic", "license",
    "rto", "permit", "auto", "taxi", "cab", "accident", "signal",
    "highway", "toll", "parking",
  ],
  "Social Welfare Department": [
    "pension", "disability", "widow", "orphan", "welfare", "ration",
    "subsidy", "benefit", "scheme", "poor", "below poverty", "anganwadi",
    "midday meal", "unemployment", "relief",
  ],
  "Consumer Affairs Department": [
    "product", "consumer", "quality", "defect", "refund", "service",
    "warranty", "price", "billing", "overcharge", "company",
    "manufacturer", "ecommerce", "online shopping", "misleading",
  ],
};

// ─────────────────────────────────────────────
// Text Preprocessing
// ─────────────────────────────────────────────

function preprocess(text: string): string {
  const lower = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const tokens = tokenizer.tokenize(lower) || [];
  const stemmed = tokens
    .filter((t) => t.length > 2)
    .map((t) => stemmer.stem(t));
  return stemmed.join(" ");
}

// ─────────────────────────────────────────────
// TF-IDF Cosine Similarity
// ─────────────────────────────────────────────

function buildVector(
  tfidf: InstanceType<typeof TfIdf>,
  docIndex: number
): Map<string, number> {
  const vector = new Map<string, number>();
  tfidf.listTerms(docIndex).forEach((item) => {
    vector.set(item.term, item.tfidf);
  });
  return vector;
}

function cosineSimilarity(
  vecA: Map<string, number>,
  vecB: Map<string, number>
): number {
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  vecA.forEach((valA, term) => {
    magnitudeA += valA * valA;
    if (vecB.has(term)) {
      dotProduct += valA * vecB.get(term)!;
    }
  });

  vecB.forEach((valB) => {
    magnitudeB += valB * valB;
  });

  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

// ─────────────────────────────────────────────
// Find Top-3 Similar Complaints
// ─────────────────────────────────────────────

export function findSimilarComplaints(
  targetComplaint: IComplaint,
  allComplaints: IComplaint[]
): SimilarComplaint[] {
  const candidates = allComplaints.filter(
    (c) => String(c._id) !== String(targetComplaint._id)
  );

  if (candidates.length === 0) return [];

  const tfidf = new TfIdf();
  const targetText = preprocess(
    `${targetComplaint.title} ${targetComplaint.description}`
  );
  tfidf.addDocument(targetText); // index 0 = target

  candidates.forEach((c) => {
    tfidf.addDocument(preprocess(`${c.title} ${c.description}`));
  });

  const targetVec = buildVector(tfidf, 0);

  const scored: (SimilarComplaint & { _raw: number })[] = candidates.map(
    (c, idx) => {
      const candidateVec = buildVector(tfidf, idx + 1);
      const score = cosineSimilarity(targetVec, candidateVec);
      return {
        complaintId: String(c._id),
        title: c.title,
        description:
          c.description.length > 150
            ? c.description.substring(0, 150) + "..."
            : c.description,
        department: c.department || "Unassigned",
        status: c.status,
        similarityScore: Math.round(score * 100),
        _raw: score,
      };
    }
  );

  return scored
    .filter((s) => s._raw > 0.05)
    .sort((a, b) => b._raw - a._raw)
    .slice(0, 3)
    .map(({ _raw, ...rest }) => rest);
}

// ─────────────────────────────────────────────
// Extract Keywords (TF-IDF top terms)
// ─────────────────────────────────────────────

export function extractKeywords(text: string): string[] {
  const tfidf = new TfIdf();
  tfidf.addDocument(preprocess(text));
  return tfidf
    .listTerms(0)
    .sort((a, b) => b.tfidf - a.tfidf)
    .slice(0, 10)
    .map((t) => t.term)
    .filter((t) => t.length > 3);
}

// ─────────────────────────────────────────────
// Priority Suggestion
// ─────────────────────────────────────────────

export function suggestPriority(
  text: string
): AIAnalysisResult["prioritySuggestion"] {
  const lower = text.toLowerCase();
  for (const priority of ["URGENT", "HIGH", "MEDIUM", "LOW"] as const) {
    const hits = PRIORITY_KEYWORDS[priority].filter((kw) =>
      lower.includes(kw)
    );
    if (hits.length > 0) return priority;
  }
  return "LOW";
}

// ─────────────────────────────────────────────
// Department Suggestion
// ─────────────────────────────────────────────

export function suggestDepartment(text: string): string {
  const lower = text.toLowerCase();
  const scores: Record<string, number> = {};
  Object.entries(DEPARTMENT_KEYWORDS).forEach(([dept, keywords]) => {
    scores[dept] = keywords.filter((kw) => lower.includes(kw)).length;
  });
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] > 0 ? best[0] : "General Administration";
}

// ─────────────────────────────────────────────
// Risk Score Calculation
// ─────────────────────────────────────────────

export function calculateRiskScore(
  text: string,
  priority: AIAnalysisResult["prioritySuggestion"],
  similarCount: number
): { score: number; level: AIAnalysisResult["riskLevel"] } {
  let score = 0;

  const priorityWeights: Record<string, number> = {
    URGENT: 50,
    HIGH: 35,
    MEDIUM: 20,
    LOW: 5,
  };
  score += priorityWeights[priority] ?? 5;

  const lower = text.toLowerCase();
  const urgentKeywords = [
    ...PRIORITY_KEYWORDS.URGENT,
    ...PRIORITY_KEYWORDS.HIGH,
  ];
  const hitCount = urgentKeywords.filter((kw) => lower.includes(kw)).length;
  score += Math.min(hitCount * 5, 25);

  if (similarCount >= 3) score += 15;
  else if (similarCount === 2) score += 10;
  else if (similarCount === 1) score += 5;

  if (text.length > 500) score += 5;
  if (text.length > 1000) score += 5;

  score = Math.min(Math.round(score), 100);

  let level: AIAnalysisResult["riskLevel"];
  if (score >= 75) level = "CRITICAL";
  else if (score >= 50) level = "HIGH";
  else if (score >= 25) level = "MEDIUM";
  else level = "LOW";

  return { score, level };
}

// ─────────────────────────────────────────────
// Analysis Reason Builder
// ─────────────────────────────────────────────

function buildAnalysisReason(
  priority: string,
  riskLevel: string,
  department: string,
  keywords: string[],
  similarCount: number
): string {
  const parts: string[] = [];
  parts.push(
    `Complaint classified as ${priority} priority based on detected keywords.`
  );
  if (keywords.length > 0) {
    parts.push(`Key terms identified: ${keywords.slice(0, 5).join(", ")}.`);
  }
  parts.push(`Suggested department: ${department}.`);
  if (similarCount > 0) {
    parts.push(
      `${similarCount} similar past complaint(s) found — may indicate a recurring issue.`
    );
  } else {
    parts.push("No similar past complaints detected.");
  }
  parts.push(`Overall risk level assessed as ${riskLevel}.`);
  return parts.join(" ");
}

// ─────────────────────────────────────────────
// Main Export: Analyze Complaint
// ─────────────────────────────────────────────

export function analyzeComplaint(
  targetComplaint: IComplaint,
  allComplaints: IComplaint[]
): AIAnalysisResult {
  const fullText = `${targetComplaint.title} ${targetComplaint.description}`;

  const similarComplaints = findSimilarComplaints(targetComplaint, allComplaints);
  const keywords = extractKeywords(fullText);
  const prioritySuggestion = suggestPriority(fullText);
  const departmentSuggestion = suggestDepartment(fullText);
  const { score: riskScore, level: riskLevel } = calculateRiskScore(
    fullText,
    prioritySuggestion,
    similarComplaints.length
  );

  const analysisReason = buildAnalysisReason(
    prioritySuggestion,
    riskLevel,
    departmentSuggestion,
    keywords,
    similarComplaints.length
  );

  return {
    riskScore,
    riskLevel,
    prioritySuggestion,
    departmentSuggestion,
    similarComplaints,
    keywords,
    analysisReason,
  };
}
