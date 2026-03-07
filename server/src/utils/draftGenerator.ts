// path: server/src/utils/draftGenerator.ts
// Generates a formatted formal complaint draft letter from complaint data.
// This is a template-based approach. TODO: replace with GPT/Gemini API call
// for a richer, context-aware draft.

interface DraftParams {
  complaintId: string;
  userName: string;
  category: string;
  description: string;
  suggestedActs?: string[];
  date?: Date;
}

export function generateComplaintDraft(params: DraftParams): string {
  const { complaintId, userName, category, description, suggestedActs = [], date = new Date() } = params;
  const formattedDate = date.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const actsSection = suggestedActs.length > 0
    ? `\nRelevant Legal Acts / Sections:\n${suggestedActs.map((a) => `  • ${a}`).join('\n')}\n`
    : '';

  return `
NEETHIVAAN – Legal Grievance Portal
Complaint Reference: ${complaintId}
Date: ${formattedDate}

To,
The Concerned Authority / Grievance Officer

Subject: Formal Complaint – ${category}

Respected Sir/Madam,

I, ${userName}, hereby submit the following complaint for your immediate attention and redressal.

Category: ${category}
${actsSection}
Details of Complaint:
${description}

I request you to kindly look into the matter and take necessary action at the earliest.

I affirm that the information provided is accurate to the best of my knowledge.

Yours faithfully,
${userName}
(Via NEETHIVAAN Portal – Ref: ${complaintId})
`.trim();
}
