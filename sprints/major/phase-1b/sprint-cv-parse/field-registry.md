# Field Registry — CV Parse Sprint

Specs reference fields by codename. Look up column names here when implementing.

## User Profile Fields

| Code | Column | Type |
|------|--------|------|
| UF1 | dob | date |
| UF2 | home_country | text |
| UF3 | smoke_pref | text |
| UF4 | appearance_note | text |
| UF5 | travel_docs | text[] |
| UF6 | license_info | text |
| UF7 | languages | jsonb |
| UF8 | show_dob | boolean |
| UF9 | show_home_country | boolean |

### UF Enum Values

UF3: non_smoker, smoker, social_smoker
UF4: none, visible, non_visible, not_specified
UF7 shape: [{language, proficiency}] where proficiency is native/fluent/intermediate/basic

## Yacht Fields

| Code | Column | Type |
|------|--------|------|
| YF1 | builder | text |

## Attachment Fields

| Code | Column | Type |
|------|--------|------|
| AF1 | employment_type | text |
| AF2 | yacht_program | text |
| AF3 | description | text |
| AF4 | cruising_area | text |

### AF Enum Values

AF1: permanent, seasonal, freelance, relief, temporary
AF2: private, charter, private_charter
AF3: max 2000 chars

## Existing Columns

| Code | Table.Column |
|------|-------------|
| EF1 | certifications.issuing_body |

## Display Rules

- UF1 renders as calculated age, never raw value
- UF2 renders as flag emoji via countryToFlag() helper
- UF3, UF4, UF5, UF6 shown on generated CV only, NOT on profile page
- UF7 shown as chips on profile, with proficiency on CV
- UF8/UF9 are visibility toggles for UF1/UF2
- YF1 shown in experience entries
- AF3 expandable on public profile, truncated to 500 chars on PDF
