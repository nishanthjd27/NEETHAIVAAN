// path: server/src/ml/intentClassifier.ts
// ─────────────────────────────────────────────────────────────────────────────
// NEETHIVAAN Intent Classifier
// ─────────────────────────────────────────────────────────────────────────────
// Phase 1 (current): Keyword/rule-based fallback classifier.
// Phase 2 (TODO):    Replace with TF-IDF + Naive Bayes using 'natural' library.
// Phase 3 (TODO):    Replace with a fine-tuned DistilBERT or FastText model
//                    served via a Python microservice (Flask/FastAPI).
//
// DATASET FORMAT (for training a real model)
// ------------------------------------------
// Save as: server/src/ml/data/training_data.jsonl
// Each line is a JSON object:
//   {"text": "My landlord is refusing to return my deposit", "intent": "tenant_rights", "domain": "housing"}
//   {"text": "Police did not register my FIR", "intent": "police_complaint", "domain": "law_enforcement"}
//   {"text": "I was cheated in an online purchase", "intent": "consumer_fraud", "domain": "consumer"}
//   {"text": "Salary not paid for 3 months", "intent": "labour_dispute", "domain": "labour"}
//   {"text": "Hospital overcharged for treatment", "intent": "medical_negligence", "domain": "healthcare"}
//
// RECOMMENDED LIBRARIES
// ─────────────────────
// Node.js:  npm install natural ml-classify-text
// Python:   pip install scikit-learn joblib fasttext
//
// TRAINING COMMANDS (Python – recommended for production)
// ─────────────────────────────────────────────────────────
//   cd server/src/ml
//   python train.py                  # trains TF-IDF + Naive Bayes, saves model.pkl
//   python serve.py                  # starts Flask server on port 5001
//   # Expected output:
//   # Training accuracy: 0.94
//   # Model saved to artifacts/model.pkl
//   # Serving on http://0.0.0.0:5001
//
// REPLACING THIS FILE
// ───────────────────
// Once the Python service is running, replace classify() body with:
//   const r = await fetch('http://localhost:5001/classify', {method:'POST', body: JSON.stringify({text})})
//   return await r.json()

import fs from 'fs';
import path from 'path';

// ── Types ────────────────────────────────────────────────────────────────────
export interface ClassificationResult {
  intent: string;
  domain: string;
  suggestedActs: string[];
  confidence: number;  // 0–1
}

export interface TrainingSample {
  text: string;
  intent: string;
  domain: string;
}

// ── Keyword Rules ─────────────────────────────────────────────────────────────
// Each rule maps a regex pattern to intent/domain/acts.
// TODO: expand this table with 100+ patterns or replace with a trained model.
const RULES: Array<{
  pattern: RegExp;
  intent: string;
  domain: string;
  acts: string[];
}> = [
  {
    pattern: /landlord|tenant|rent|deposit|evict|lease/i,
    intent:  'tenant_rights',
    domain:  'housing',
    acts:    ['Transfer of Property Act 1882', 'Rent Control Act (State-specific)'],
  },
  {
    pattern: /fir|police|arrest|detention|custody|constable/i,
    intent:  'police_complaint',
    domain:  'law_enforcement',
    acts:    ['Code of Criminal Procedure (CrPC) Sec 154', 'Human Rights Act 1993'],
  },
  {
    pattern: /consumer|cheat|fraud|refund|defective|product|service|overcharge/i,
    intent:  'consumer_fraud',
    domain:  'consumer',
    acts:    ['Consumer Protection Act 2019', 'IT Act 2000 (for online fraud)'],
  },
  {
    pattern: /salary|wage|employer|labour|job|workplace|termination|retrench/i,
    intent:  'labour_dispute',
    domain:  'labour',
    acts:    ['Industrial Disputes Act 1947', 'Payment of Wages Act 1936', 'Shops & Establishments Act'],
  },
  {
    pattern: /hospital|doctor|medical|treatment|negligence|medicine|drug/i,
    intent:  'medical_negligence',
    domain:  'healthcare',
    acts:    ['Consumer Protection Act 2019 (Medical Services)', 'Indian Medical Council Act 1956'],
  },
  {
    pattern: /corruption|bribe|official|government|officer|pco|pmo/i,
    intent:  'corruption_report',
    domain:  'governance',
    acts:    ['Prevention of Corruption Act 1988', 'Right to Information Act 2005'],
  },
  {
    pattern: /harassment|sexual|molest|abuse|assault|workplace harassment/i,
    intent:  'harassment_complaint',
    domain:  'gender_rights',
    acts:    ['POSH Act 2013', 'IPC Section 354', 'IPC Section 509'],
  },
  {
    pattern: /property|land|encroach|boundary|registry|mutation/i,
    intent:  'property_dispute',
    domain:  'property',
    acts:    ['Transfer of Property Act 1882', 'Registration Act 1908', 'Specific Relief Act 1963'],
  },
  {
    pattern: /cyber|hacker|hack|phishing|online|digital|data|privacy/i,
    intent:  'cybercrime',
    domain:  'cyber',
    acts:    ['IT Act 2000', 'IT (Amendment) Act 2008', 'Data Protection Bill 2023'],
  },
  {
    pattern: /road|traffic|accident|rtc|rto|vehicle|licence|driving/i,
    intent:  'traffic_dispute',
    domain:  'transport',
    acts:    ['Motor Vehicles Act 1988', 'Motor Vehicles (Amendment) Act 2019'],
  },
];

const DEFAULT_RESULT: ClassificationResult = {
  intent:       'general_grievance',
  domain:       'general',
  suggestedActs:['Right to Information Act 2005'],
  confidence:    0.3,
};

// ── Core classify function ────────────────────────────────────────────────────
export function classify(text: string): ClassificationResult {
  const lower = text.toLowerCase();
  let best: ClassificationResult | null = null;
  let bestMatchCount = 0;

  for (const rule of RULES) {
    const matchResult = lower.match(rule.pattern);
    const count = matchResult ? matchResult.length : 0;
    if (count > bestMatchCount) {
      bestMatchCount = count;
      best = {
        intent:        rule.intent,
        domain:        rule.domain,
        suggestedActs: rule.acts,
        confidence:    Math.min(0.5 + count * 0.1, 0.95),
      };
    }
  }

  return best ?? DEFAULT_RESULT;
}

// ── Model persistence stubs ───────────────────────────────────────────────────
const MODEL_PATH = path.resolve(__dirname, 'artifacts', 'model.json');

/**
 * TODO: Replace with real model training.
 * Recommended steps:
 *  1. Collect 500+ labelled complaints in training_data.jsonl
 *  2. Use 'natural' library's BayesClassifier:
 *     const classifier = new natural.BayesClassifier();
 *     samples.forEach(s => classifier.addDocument(s.text, s.intent));
 *     classifier.train();
 *  3. Save via classifier.save(MODEL_PATH, cb)
 */
export function trainModel(samples: TrainingSample[]): void {
  console.log(`[ML] trainModel called with ${samples.length} samples`);
  console.log('[ML] TODO: implement TF-IDF + Naive Bayes training');
  console.log('[ML] TODO: run: npm install natural && implement BayesClassifier');
  // STUB – no real training happens here
}

export function saveModel(data: unknown): void {
  try {
    fs.mkdirSync(path.dirname(MODEL_PATH), { recursive: true });
    fs.writeFileSync(MODEL_PATH, JSON.stringify(data, null, 2));
    console.log('[ML] Model stub saved to', MODEL_PATH);
  } catch (err) {
    console.error('[ML] Failed to save model:', err);
  }
}

export function loadModel(): unknown {
  try {
    if (fs.existsSync(MODEL_PATH)) {
      return JSON.parse(fs.readFileSync(MODEL_PATH, 'utf-8'));
    }
  } catch (err) {
    console.error('[ML] Failed to load model:', err);
  }
  return null;
}
