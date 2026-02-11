# Yachtielink Security Protocols

**Version:** 1.0  
**Date:** 2026-01-28  
**Status:** Pre-build  
**Scope:** External attacks, system abuse, resource exploitation

---

## Why Security Matters Here

Yachtielink is a trust platform. A security breach doesn't just leak data — it destroys the product's reason to exist. If endorsements can be faked, accounts impersonated, or signals manipulated, the entire value proposition collapses.

Security is not a feature. It's a precondition for trust.

---

## 1. External Attack Defense

### 1.1 Authentication & Sessions

**Supported login methods:**
- Google OAuth
- Apple OAuth
- Email/password (no magic links)

**Design assumptions:**
- Mobile-first: users rely on password managers (iOS Keychain, 1Password, etc.)
- Biometric unlock (Face ID, Touch ID) handles login friction
- Multiple concurrent sessions per account is normal (phone, tablet, desktop)

| Rule | Implementation | Notes |
|------|----------------|-------|
| All auth via Supabase Auth | No custom auth code | Leverage battle-tested system |
| OAuth providers | Google + Apple only | Industry standard, mobile-native |
| Email/password as fallback | No magic links | Password managers handle complexity |
| Session tokens are HTTP-only cookies | Supabase default | Prevents XSS token theft |
| Password minimum 12 characters | Supabase config | Assume password manager generates |
| No password hints or security questions | Don't build | These weaken security |
| Multiple concurrent sessions allowed | Supabase default | Phone + tablet + desktop normal |
| Session duration | 30 days, refresh on activity | Balance security/convenience |
| Rate limit login attempts | 5 attempts per 15 minutes per IP | Prevent brute force |
| Rate limit OAuth attempts | 10 attempts per 15 minutes per IP | Prevent OAuth abuse |

### 1.2 Authorization & Row Level Security (RLS)

Every Supabase table must have RLS enabled. No exceptions.

| Pattern | Use Case | Example |
|---------|----------|---------|
| `auth.uid() = user_id` | User owns this row | Profile, employment records |
| `EXISTS (SELECT 1 FROM connections...)` | User has relationship | Messaging access |
| `EXISTS (SELECT 1 FROM attachments...)` | Shared yacht attachment | Endorsement eligibility |
| `is_public = true OR auth.uid() = user_id` | Public or owner | Public profile view |

**Critical rule:** Never trust client-side checks alone. RLS is the enforcement layer.

### 1.3 Input Validation

| Input Type | Validation | Location |
|------------|------------|----------|
| All user text | Sanitize HTML, limit length | API route |
| Yacht names | Max 100 chars, no HTML | API route |
| Endorsement text | Max 2000 chars, no HTML | API route |
| Dates | ISO 8601 format, no future dates beyond today | API route |
| File uploads | Type whitelist (jpg, png, pdf), max 5MB | API route + Supabase Storage |
| UUIDs | Validate format before DB query | API route |

**Library:** Use `zod` for schema validation on all API inputs.

### 1.4 API Hardening

| Measure | Implementation | Notes |
|---------|----------------|-------|
| HTTPS only | Vercel default | Enforced at edge |
| CORS restricted | Allow only yachtie.link origins | Next.js config |
| No sensitive data in URLs | POST for mutations, no secrets in query params | Code review check |
| CSRF protection | Vercel/Next.js default for mutations | Verify enabled |
| Security headers | X-Frame-Options, X-Content-Type-Options, etc. | Next.js config |
| No stack traces in production | Sanitize error responses | API error handler |

### 1.5 Secrets Management

| Rule | Implementation |
|------|----------------|
| All secrets in Vercel environment variables | Never in code |
| Different secrets per environment | Staging ≠ Production |
| Rotate Supabase service key if exposed | Documented runbook |
| No secrets in logs | Code review check |
| No secrets in client bundle | Only NEXT_PUBLIC_ vars client-side |

---

## 2. System Abuse Defense

### 2.1 Endorsement Gaming Prevention

| Attack | Mitigation | Detection |
|--------|------------|-----------|
| Self-endorsement via alt account | Require shared yacht attachment | Same IP/device creating multiple accounts |
| Fake yacht to enable endorsement | Yacht must have ≥2 attached crew for endorsements | Single-user yachts flagged |
| Endorsement trading rings | Graph analysis (Phase 2) | Reciprocal endorsement clusters |
| Coerced endorsements | Retraction tracking, time delays | High retraction rate from single endorser |
| Bulk fake endorsements | Rate limit endorsement creation | >5 endorsements/day triggers review |

**Enforcement:**

| Limit | Value | Scope |
|-------|-------|-------|
| Endorsements created per day | 5 | Per user |
| Endorsements received per day | 10 | Per user |
| New yacht creations per day | 3 | Per user |
| Minimum yacht crew for endorsements | 2 | Per yacht |

### 2.2 Fake Account Detection

| Signal | Weight | Action |
|--------|--------|--------|
| Multiple accounts from same IP | Medium | Flag for review |
| Multiple accounts from same device fingerprint | High | Block creation, flag existing |
| Email domain is disposable | Medium | Require email verification click |
| Profile created but no activity in 30 days | Low | No action (normal) |
| Burst account creation pattern | High | Rate limit, CAPTCHA |

**Implementation:**
- Device fingerprinting via lightweight client-side lib (e.g., FingerprintJS open source)
- IP tracking on account creation (stored hashed, not raw)
- Disposable email domain blocklist

### 2.3 Coordinated Manipulation

| Pattern | Detection | Response |
|---------|-----------|----------|
| Multiple endorsements for same person within short window | Time clustering analysis | Delay visibility, flag for review |
| Endorsements from accounts created recently | New account + immediate endorsement | Weight reduction in Phase 2 trust calc |
| Graph anomalies | Isolated clusters with high internal endorsement | Flag cluster for review |

**Note:** Most coordination detection is Phase 2. Phase 1 focuses on rate limits and basic flags.

### 2.4 Abuse Escalation Integration

System abuse triggers feed into the escalation protocol defined in `yl_phase1_actionables.json`:

| Trigger | Escalation Level |
|---------|------------------|
| Single anomaly flag | Level 1 (Monitor) |
| Second independent signal | Level 2 (Shadow-constrain) |
| Three+ signals or confirmed abuse | Level 3 (Freeze) |

---

## 3. Resource Exploitation Defense

### 3.1 Rate Limiting

All rate limits enforced via Vercel KV (Upstash Redis).

| Endpoint Category | Limit | Window | Scope |
|-------------------|-------|--------|-------|
| Authentication (login, signup) | 10 requests | 15 minutes | Per IP |
| Profile view (public) | 100 requests | 1 minute | Per IP |
| Profile edit | 30 requests | 1 minute | Per user |
| Endorsement create | 5 requests | 24 hours | Per user |
| Endorsement edit | 20 requests | 1 hour | Per user |
| PDF generation | 10 requests | 1 hour | Per user |
| File upload | 20 requests | 1 hour | Per user |
| Search | 60 requests | 1 minute | Per user |
| Messaging send | 60 messages | 1 minute | Per user |
| Account flagging | 10 flags | 7 days | Per user |
| First-contact messaging | 5 new threads | 24 hours | Per user |

**Response when limit hit:** HTTP 429 with `Retry-After` header. No information leakage about limits.

### 3.2 PDF Generation Limits

PDF generation is CPU-intensive and a cost vector.

| Limit | Value | Enforcement |
|-------|-------|-------------|
| PDFs per user per hour | 10 | Vercel KV counter |
| PDF file size max | 5MB | Abort generation if exceeded |
| PDF generation timeout | 8 seconds | Vercel function timeout |
| Concurrent PDF generations | 1 per user | Queue with Vercel KV lock |

**Abuse pattern:** Automated scraping via PDF endpoint. Mitigation: Auth required, rate limit, no bulk export API.

### 3.3 Storage Limits

| Resource | Limit | Enforcement |
|----------|-------|-------------|
| Profile photo | 2MB | Client + API validation |
| Certificate upload | 5MB per file | Client + API validation |
| Total storage per user | 50MB | Supabase policy |
| Yacht images | 5MB per image, 3 images max | Client + API validation |

**Abuse pattern:** Storage bombing with max-size files. Mitigation: Per-user quota enforced at upload.

### 3.4 Cost Spike Alerting

| Metric | Threshold | Alert |
|--------|-----------|-------|
| Vercel function invocations | >10x daily average | Email to founder + PM |
| Supabase database size | >80% of plan limit | Email to founder + PM |
| Supabase bandwidth | >80% of plan limit | Email to founder + PM |
| Stripe failed payment rate | >5% | Email to founder + PM |

**Implementation:** Vercel and Supabase built-in alerting, configured at project setup.

### 3.5 Denial of Service

| Attack | Mitigation |
|--------|------------|
| Volumetric DDoS | Vercel edge handles (included) |
| Application-layer flood | Rate limiting per above |
| Slowloris | Vercel edge handles |
| Resource exhaustion | Timeouts on all functions (10s default) |

---

## 4. Code Review Security Checklist

Every PR must verify:

### Authentication & Authorization
- [ ] Endpoint requires auth if not public?
- [ ] RLS policy exists and is tested for this table?
- [ ] No auth checks in client code only (server must enforce)?
- [ ] User can only access/modify their own data (or explicitly permitted)?

### Input & Output
- [ ] All inputs validated with zod schema?
- [ ] No raw user input in SQL (parameterized queries only)?
- [ ] No user input in HTML without sanitization?
- [ ] Error messages don't leak system info?

### Secrets & Data
- [ ] No secrets in code, logs, or client bundle?
- [ ] No PII in logs?
- [ ] Sensitive data excluded from API responses unless needed?

### Rate Limiting & Resources
- [ ] Endpoint has appropriate rate limit?
- [ ] File uploads validated for type and size?
- [ ] No unbounded loops or queries?
- [ ] Function has timeout?

### Abuse Vectors
- [ ] Feature can't be used for endorsement gaming?
- [ ] Feature can't be used to harvest user data?
- [ ] Feature can't be used to spam other users?

---

## 5. Incident Response

### 5.1 Severity Levels

| Level | Definition | Example | Response Time |
|-------|------------|---------|---------------|
| **P1 Critical** | Active breach, data exposed | Auth bypass, data leak | Immediate (drop everything) |
| **P2 High** | Exploitable vulnerability found | RLS gap, injection vector | Within 4 hours |
| **P3 Medium** | Abuse detected, contained | Endorsement gaming caught | Within 24 hours |
| **P4 Low** | Anomaly, unclear impact | Unusual traffic pattern | Within 72 hours |

### 5.2 Response Procedure

**P1 Critical:**
1. Confirm breach (check logs, scope impact)
2. Contain (disable affected feature, revoke sessions if needed)
3. Notify founder immediately (phone if needed)
4. Document timeline
5. Fix and deploy
6. Post-mortem within 48 hours
7. User notification if PII exposed (per GDPR)

**P2–P4:**
1. Document in incident log
2. Assign owner (PM or founder)
3. Fix within response time
4. Update security doc if new pattern

### 5.3 Contact Chain

| Role | Contact | When |
|------|---------|------|
| PM | First responder | All incidents |
| Founder (Ari) | Escalation | P1, P2, or if PM unavailable |
| Legal | If data breach confirmed | P1 with PII exposure |

### 5.4 Logging for Incident Investigation

| Event | Logged | Retention |
|-------|--------|-----------|
| Login attempts (success/fail) | Yes (no passwords) | 90 days |
| Auth token refresh | Yes | 30 days |
| Endorsement create/edit/delete | Yes | Indefinite |
| Rate limit hits | Yes | 30 days |
| File uploads | Yes (metadata only) | 90 days |
| Admin actions | Yes | Indefinite |
| API errors | Yes (sanitized) | 30 days |

**PII in logs:** Never log passwords, full emails (hash if needed), or endorsement content. Log user IDs, timestamps, and actions only.

---

## Cross-References

| Topic | Document |
|-------|----------|
| Abuse escalation tiers | `yl_phase1_actionables.json` → `abuse_escalation_protocol` |
| Rate limit infrastructure | `yl_tech_stack.md` → Vercel KV |
| Growth pause trigger | `yl_phase1_actionables.json` → `growth_controls` |
| Trust outcome protection | `yl_principles.md` → Canonical monetisation rule |
| WebSocket connection limits | `yl_phase1_actionables.json` → `websocket_concurrent_connections` |

---

## Review Schedule

| Review | Frequency | Owner |
|--------|-----------|-------|
| Security checklist in PR | Every PR | Reviewer |
| Rate limit tuning | Monthly | PM |
| Abuse pattern review | Weekly | PM |
| Full security audit | Before public beta | External (TBD) |
| Penetration test | Before public beta | External (TBD) |
