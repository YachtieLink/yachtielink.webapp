export const CV_EXTRACTION_PROMPT = `You are extracting structured data from a yacht crew CV. The text below may span MULTIPLE PAGES — read the ENTIRE document from start to finish before extracting. Do not stop after the first page. Return ONLY valid JSON matching the schema below. Every key must be present. Use null for missing values, empty arrays for missing lists.

{
  "personal": {
    "full_name": "string|null",
    "primary_role": "string|null — most recent/main role title",
    "bio": "string|null — professional summary, max 500 chars",
    "phone": "string|null",
    "email": "string|null",
    "location_country": "string|null — ISO country name",
    "location_city": "string|null",
    "dob": "YYYY-MM-DD|null",
    "home_country": "string|null — nationality/home country, ISO name",
    "smoke_pref": "non_smoker|smoker|social_smoker|null",
    "appearance_note": "none|visible|non_visible|not_specified|null — tattoos/piercings",
    "travel_docs": ["string"] — visas, seaman's books, travel documents,
    "license_info": "string|null — driving license details"
  },
  "languages": [
    { "language": "string", "proficiency": "native|fluent|intermediate|basic" }
  ],
  "employment_yacht": [
    {
      "yacht_name": "string",
      "yacht_type": "Motor Yacht|Sailing Yacht|null",
      "length_meters": number|null,
      "flag_state": "string|null — country name",
      "builder": "string|null — shipyard/builder name",
      "role": "string",
      "start_date": "YYYY-MM|YYYY|null",
      "end_date": "YYYY-MM|YYYY|Current|null",
      "employment_type": "permanent|seasonal|freelance|relief|temporary|null",
      "yacht_program": "private|charter|private_charter|null",
      "description": "string|null — role responsibilities, max 2000 chars",
      "cruising_area": "string|null — e.g. Mediterranean, Caribbean",
      "crew_count": number|null,
      "guest_count": number|null,
      "former_names": ["string"] — previous yacht names in parentheses
    }
  ],
  "employment_land": [
    {
      "company": "string",
      "role": "string",
      "start_date": "YYYY-MM|null",
      "end_date": "YYYY-MM|null",
      "description": "string|null"
    }
  ],
  "certifications": [
    {
      "name": "string",
      "category": "Safety & Sea Survival|Medical|Navigation & Watchkeeping|Engineering|Hospitality & Service|Water Sports & Leisure|Regulatory & Flag State|Other|null",
      "issued_date": "YYYY-MM|YYYY|null",
      "expiry_date": "YYYY-MM|YYYY|null",
      "issuing_body": "string|null — issuing authority"
    }
  ],
  "education": [
    {
      "institution": "string",
      "qualification": "string|null",
      "field_of_study": "string|null",
      "location": "string|null",
      "start_date": "YYYY-MM|YYYY|null",
      "end_date": "YYYY-MM|YYYY|null"
    }
  ],
  "skills": ["string"],
  "hobbies": ["string"],
  "references": [
    {
      "name": "string",
      "role": "string|null",
      "yacht_or_company": "string|null",
      "phone": "string|null",
      "email": "string|null"
    }
  ],
  "social_media": {
    "instagram": "string|null — handle only, no URL",
    "website": "string|null"
  }
}

Rules:
- Yacht CVs list vessels in reverse chronological order
- Convert feet to metres (1 ft = 0.3048m), round to nearest whole number
- M/Y = Motor Yacht, S/Y = Sailing Yacht
- Former yacht names appear in parentheses — extract to former_names array
- Builder names are shipyards (e.g. Lürssen, Feadship, Benetti)
- Parse cert expiry from inline notes like "expires 2026" or "valid until 03/2027"
- Only extract references that have both a name AND at least one contact method (phone or email)
- If a language is listed without proficiency, infer from context (native for nationality language, fluent otherwise)
- Role names should match yachting conventions (Captain, Chief Stewardess, Bosun, Deckhand, etc.)
- Return valid JSON only — no markdown, no code fences, no explanation`;

export const CV_PERSONAL_PROMPT = `You are extracting personal details and languages from a yacht crew CV. The text below may span MULTIPLE PAGES — scan the ENTIRE document for personal details and languages, not just the first page. Return ONLY valid JSON matching this schema. Use null for missing values, empty arrays for missing lists.

{
  "personal": {
    "full_name": "string|null",
    "primary_role": "string|null — most recent/main role title",
    "bio": "string|null — professional summary, max 500 chars",
    "phone": "string|null",
    "email": "string|null",
    "location_country": "string|null — ISO country name",
    "location_city": "string|null",
    "dob": "YYYY-MM-DD|null",
    "home_country": "string|null — nationality/home country, ISO name",
    "smoke_pref": "non_smoker|smoker|social_smoker|null",
    "appearance_note": "none|visible|non_visible|not_specified|null — tattoos/piercings",
    "travel_docs": ["string"] — visas, seaman's books, travel documents,
    "license_info": "string|null — driving license details"
  },
  "languages": [
    { "language": "string", "proficiency": "native|fluent|intermediate|basic" }
  ]
}

Rules:
- If a language is listed without proficiency, infer from context (native for nationality language, fluent otherwise)
- Return valid JSON only — no markdown, no code fences, no explanation`;
