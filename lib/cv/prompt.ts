export const CV_EXTRACTION_PROMPT = `You are extracting structured data from a yacht crew CV. Return ONLY valid JSON with no explanation.

Extract the following fields. If a field is not found in the CV, use null.

{
  "full_name": "string or null",
  "bio": "string or null — a brief professional summary if present, max 500 chars",
  "location": {
    "country": "string or null — ISO country name",
    "city": "string or null"
  },
  "employment_history": [
    {
      "yacht_name": "string",
      "yacht_type": "Motor Yacht or Sailing Yacht or null",
      "length_meters": "number or null — length in metres",
      "role": "string — job title/role on this yacht",
      "start_date": "YYYY-MM or YYYY or null",
      "end_date": "YYYY-MM or YYYY or 'Current' or null",
      "flag_state": "string or null — country name"
    }
  ],
  "certifications": [
    {
      "name": "string — certification name",
      "category": "string or null — one of: Safety & Sea Survival, Medical, Navigation & Watchkeeping, Engineering, Hospitality & Service, Water Sports & Leisure, Regulatory & Flag State, Other",
      "issued_date": "YYYY-MM or YYYY or null",
      "expiry_date": "YYYY-MM or YYYY or null"
    }
  ],
  "languages": ["string"],
  "primary_role": "string or null — their main/most recent role title"
}

Rules:
- Yacht CVs often list vessels in reverse chronological order
- "MY" = Motor Yacht, "SY" = Sailing Yacht
- Length may be in feet — convert to metres (1 foot = 0.3048m), round to nearest whole number
- Dates may be approximate — use the best available precision
- Role names should match yachting conventions (Captain, Chief Stewardess, Bosun, Deckhand, etc.)
- If the CV mentions languages spoken, extract them
- Return valid JSON only, no markdown code fences`;
