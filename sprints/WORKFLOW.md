# Sprint & Rally Execution Workflow

The canonical reference for how work moves from idea to shipped code. Read this when you're about to start executing — not on every session start.

**What to read based on your task:**
- **Major sprint** → The Loop (Steps 1–6) + Parallel Agent Patterns + Common Mistakes
- **Junior sprint** → The Loop (Steps 1–6, lighter intensity — see Workflow by Sprint Size table)
- **Rally** → Rally Execution (Steps R1–R6) + Parallel Agent Patterns
- **Quick fix** → Skim Steps 4–6 only — just build, verify, ship

---

## The Loop (Sprint Execution)

Every sprint follows the same core loop, scaled to the size of the work:

```
1. SCOPE    →  Define what's in, what's out, what's blocked
2. PLAN     →  Write the spec (README + build_plan.md)
3. REVIEW   →  Stress-test the plan before any code is written
4. BUILD    →  Execute the plan, wave by wave
5. VERIFY   →  Run the app, test end-to-end, review your own diff
6. SHIP     →  Commit, update docs, close the sprint
```

Each step has an approval gate and a failure mode. The discipline is in not skipping steps, even when the fix seems obvious.

---

## Step 1 — SCOPE

**Who drives:** Founder.

**What happens:**
- Founder defines the problem, walks through screens, provides screenshots
- Founder sets boundaries: what's in, what's out, what's deferred
- Agent asks clarifying questions — never assumes scope

**Output:** A clear, bounded problem statement. Could be a Slack message, a QA walkthrough, or a notes file.

**Approval gate:** Founder confirms the scope before planning begins.

**Failure mode:** Agent builds something the founder didn't ask for. Agent drags in "related" features that weren't requested. Agent assumes a UI layout without seeing the current screen.

---

## Step 2 — PLAN

**Who drives:** Agent.

**What happens:**
- Write a `README.md` defining the sprint: scope, deliverables, dependencies, exit criteria
- For non-trivial work, write a `build_plan.md` with:
  - Every file that will be created or modified (by name, not "12+ files")
  - Migration SQL if schema changes
  - Component specs with interfaces
  - API route signatures
  - Implementation order (dependency waves)
  - Testing checklist
  - Rollback plan

**For junior sprints:** The README alone may be sufficient. A 3-line bug fix doesn't need a build_plan.md. Use judgement — if you'd need to think through dependencies or touch more than 2-3 files, write the plan.

**Output:** README.md and optionally build_plan.md in the sprint folder.

**Approval gate:** Founder reviews and confirms before building. For junior bug fixes, a verbal "go" is sufficient.

**Failure mode:** Build plan says "update the component" without specifying which props change. Plan references columns that don't exist in the schema. Exit criteria are prose ("make sure it works") instead of runnable commands.

---

## Step 3 — REVIEW (pre-build)

**Who drives:** Agent (reviewer role — ideally a separate subagent from the planner).

**What happens:**
- A reviewer agent reads the plan with adversarial eyes
- Checks against the Build Plan Quality Checklist (see `sprints/major/README.md`):
  1. Every file is named explicitly
  2. Exit criteria are runnable commands, not prose
  3. One source of truth — plan is a single file, not scattered
  4. New components have full interface specs
  5. Contradictions between README and plan are resolved
  6. Schema/API changes are flagged explicitly
  7. Grep patterns include `--include` and exclusion patterns
- For major sprints: spawn a dedicated Sonnet reviewer subagent
- For junior sprints: self-review is acceptable — read the plan back with fresh eyes before building

**Output:** Review report with severity-classified findings (CRITICAL / HIGH / MEDIUM / LOW). All CRITICAL findings must be fixed in the plan before proceeding.

**Approval gate:** Zero CRITICAL findings. HIGH findings addressed or explicitly deferred with founder acknowledgment.

**Failure mode:** Plan references `users.deleted_at` (doesn't exist). Migration timestamps collide with other sprints. RLS policies use `auth.uid()` directly on a table that maps through `auth_user_id`. All of these have happened — see `docs/ops/lessons-learned.md`.

---

## Step 4 — BUILD

**Who drives:** Agent (builder role).

**What happens:**
- Execute the plan in dependency order (wave by wave)
- For multi-file work, use parallel Sonnet subagents where possible:
  - Divide by **file ownership** to avoid merge conflicts
  - Independent workstreams run in parallel
  - Dependent work runs sequentially
  - One agent per file or file group — never two agents editing the same file
- Follow the relevant discipline docs while building:
  - `docs/disciplines/frontend.md` — React/Next.js patterns
  - `docs/disciplines/backend.md` — API, RLS, Supabase patterns
  - `docs/disciplines/design-system.md` — tokens, components, visual rules
  - `docs/disciplines/code-review.md` — review checklist, severity classification

**Agent model guidance:**
- **Opus** for orchestration, complex decisions, architectural changes
- **Sonnet** for straightforward file-by-file implementation, parallel builders
- Don't burn Opus tokens on rote work. Don't trust Sonnet with cross-cutting architectural decisions.

**During the build:**
- Create a session log at `sessions/YYYY-MM-DD-<slug>.md` (see `sessions/README.md` for the template). Log timestamps, decisions, blockers, and coordination notes as you work — not after.
- If you discover something that changes the plan, **stop and update the plan** — don't drift
- If you're blocked, surface it in the session log and ask the founder — don't brute-force

**Approval gate:** Founder may review mid-build for large sprints. For junior sprints, proceed to verify.

**Failure mode:** Agent starts "improving" adjacent code that wasn't in the plan. Agent encounters a bug and spirals into fixing it instead of logging it as a junior sprint. Parallel agents write to the same file and one overwrites the other.

---

## Step 5 — VERIFY

**Who drives:** Agent (reviewer role — a fresh subagent is ideal for major sprints).

**What happens:**
- Run the app locally. Test every change end-to-end.
- Execute the exit criteria from the build plan (they should be runnable commands)
- For major sprints, spawn a dedicated post-build reviewer:
  - Bug finder: check for regressions, missed edge cases
  - UX reviewer: check the actual UI, not just the code
  - Code reviewer: check the diff against `docs/disciplines/code-review.md`
- Classify findings: **ADDED** (fix now, in scope), **DEFERRED** (log as junior sprint), **NOTED** (acceptable, no action)
- Review your own diff: no console.logs, no hardcoded values, no commented-out code

**Output:** Verification report. All ADDED items fixed. DEFERRED items logged.

**Approval gate:** Founder reviews the final diff before commit (for major sprints). Junior sprints may self-approve if the fix is clean and tested.

**Failure mode:** Agent says "it should work" without running the app. Agent misses a mobile layout break because they only tested desktop. Agent leaves `console.log` statements in committed code.

---

## Step 6 — SHIP

**Who drives:** Agent, with founder approval.

**What happens:**

1. Update `CHANGELOG.md` with four sections:
   - **Done** — what was built/fixed (bullet points, specific)
   - **Context** — what an incoming agent needs to know (where files live, what branch, what's partially done)
   - **Next** — what should happen in the following session
   - **Flags** — anything that needs founder attention, risks, or deferred decisions
2. Update sibling docs as applicable (check cross-reference nudges in each doc):
   - `sessions/YYYY-MM-DD-<slug>.md` — finalize working notes
   - `docs/modules/<module>.md` + `.activity.md` — if you touched any module's code
   - `docs/ops/lessons-learned.md` — if you hit a non-obvious gotcha
   - `docs/ops/feedback.md` — if the founder corrected your approach (append-only)
   - `sprints/major/README.md` or `sprints/junior/README.md` — if you opened/closed a sprint
3. Update sprint README status
4. Move sprint from Active to Completed in the relevant index
5. `git add` specific files (not `git add .`)
6. Commit with a clear message describing what shipped
7. Push to remote

**CHANGELOG is blocking.** Do not commit without updating it. This has been the single most common mistake across agents — it's now a hard rule.

**Approval gate:** Founder reviews the commit message and CHANGELOG entry.

**Failure mode:** Agent commits without updating CHANGELOG. Agent uses `git add .` and commits `.env` or lock files. Agent amends a previous commit instead of creating a new one.

---

## Rally Execution

Rallies follow their own loop. No code is written — the output is a plan that feeds into sprints. For rally types (PR / System / Full Audit), templates, and examples, see `sprints/rallies/README.md`. This section covers the execution workflow, approval gates, and failure modes that the template doesn't.

```
1. TRIGGER   →  Founder defines what to investigate and why
2. PASS 1    →  Deep analysis — understand the problem fully
3. PASS 2    →  Challenge — stress-test pass 1 findings
4. SYNTHESIZE →  Build the plan from both passes
5. APPROVE   →  Founder reviews before anything gets built
6. EXECUTE   →  Findings become sprints (major, junior, or both)
```

### Step R1 — TRIGGER

**Who drives:** Founder only. Agents never self-initiate rallies.

**What happens:**
- Founder identifies something that needs investigation before building
- Founder defines the scope: what to look at, how deep, and what kind of rally

**Output:** A clear investigation brief. Could be "audit the whole app" or "figure out why the profile page is slow."

**Failure mode:** Agent starts a rally because it "seemed like a good idea." Agent runs a rally when a junior sprint would have been faster. Rule: if you know the fix, skip the rally and just fix it.

### Step R2 — PASS 1 (Deep Analysis)

**Who drives:** Agent (analyst role).

**What happens:**
- Thorough investigation of the defined scope — read the code, trace flows, surface every issue
- Don't rush to solutions. Understand the problem fully before thinking about fixes.
- For full audits: spawn parallel Sonnet or Opus agents, each assigned a different angle

**Agent patterns by rally type:**

| Type | Pass 1 agents | Angle examples |
|------|--------------|----------------|
| **PR Rally** | 1 agent | Trace every file the PR touched |
| **System Rally** | 1–2 agents | Map the subsystem, identify bottlenecks |
| **Full Audit** | 3–6 parallel agents | UX/UI, Features/Value, Performance/Tech, Security/Auth, Data Model, Developer Experience |

**Model allocation:**
- PR Rally: Sonnet is sufficient — it's tracing known changes
- System Rally: Opus for the primary analyst, Sonnet for supporting file reads
- Full Audit: Opus for each angle agent (they need to make architectural judgements), Sonnet for file-level scanning

**Output:** Pass 1 findings — one report per agent, or a single report for lightweight rallies.

**Failure mode:** Analysis is shallow ("this component is complex" — that's not a finding). Agent prescribes solutions before understanding root causes. Agent only looks at the code and misses the user-facing behaviour.

### Step R3 — PASS 2 (Challenge & Refine)

**Who drives:** Agent (challenger role — must be a different subagent from pass 1, or at minimum a fresh context).

**What happens:**
- Review pass 1 findings with adversarial eyes
- Push back on shallow conclusions: "You said this is a performance issue, but did you profile it? Is it actually slow or just looks complex?"
- Catch what was missed: files that weren't checked, edge cases not considered, interactions between subsystems
- Upgrade or downgrade severity where pass 1 got it wrong
- For full audits: spawn dedicated challenger agents that review pass 1 reports

**Why a separate agent:** Pass 1 agents develop confirmation bias around their own findings. A fresh agent catches different things. This is the single most valuable part of the rally process — it's where Rally 001 caught structural issues that 3 pass 1 agents all missed.

**Agent patterns:**

| Type | Pass 2 agents | What they do |
|------|--------------|--------------|
| **PR Rally** | Same agent, fresh prompt | Re-read with "what did I miss?" framing |
| **System Rally** | 1 challenger agent | Review pass 1 report, probe assumptions |
| **Full Audit** | 1 challenger per pass 1 agent | Each challenger reviews one pass 1 report |

**Model allocation:** Opus for challengers. They need to reason about why pass 1 might be wrong, not just scan files.

**Output:** Pass 2 report — corrections, additions, upgraded/downgraded findings.

**Failure mode:** Challenger rubber-stamps pass 1 ("looks good to me"). Challenger gets distracted by new issues instead of stress-testing existing findings. Challenger changes the scope without founder approval.

### Step R4 — SYNTHESIZE

**Who drives:** Agent (orchestrator role).

**What happens:**
- Merge pass 1 and pass 2 findings into a single prioritized proposal
- Classify every finding:
  - **CRITICAL** — blocks launch or causes data loss
  - **HIGH** — significant UX or correctness issue
  - **MEDIUM** — quality improvement, should be planned
  - **LOW** — nice to have, can wait
- Group findings into logical workstreams that map to sprints
- Identify dependencies between workstreams (what must happen first)
- Estimate complexity: is this a junior sprint or a major sprint?

**Output:** `final_proposal.md` (or equivalent) — the synthesized plan with prioritized findings and proposed sprint structure.

**Failure mode:** Proposal is just a flat list of findings with no prioritization. Proposal groups things by "what agent found them" instead of "what sprint should fix them." Proposal includes recommendations the codebase already implements (agent didn't read the code carefully enough).

### Step R5 — APPROVE

**Who drives:** Founder.

**What happens:**
- Founder reads the proposal
- Founder adjusts priorities, defers items, changes scope, questions findings
- Founder decides what becomes sprint work and what gets shelved
- Nothing gets built until the founder signs off

**This gate is non-negotiable.** Rally 001's proposal was reviewed and the founder resequenced Phase 1C scope based on the findings. Agents should present options, not make strategic decisions.

**Output:** Approved plan with founder's adjustments noted.

**Failure mode:** Agent starts building from the proposal without waiting for approval. Agent treats the proposal as final instead of a draft for founder review.

### Step R6 — EXECUTE

**Who drives:** Agent, following the sprint workflow above.

**What happens:**
- Create sprints (major and/or junior) from the approved findings
- Link each sprint back to the rally README
- Execute using the sprint loop (Scope → Plan → Review → Build → Verify → Ship)
- Rally README gets updated with "Resulting Work" section listing all sprints created

**Output:** Sprints created, linked, and queued for execution.

---

## Workflow by Sprint Size

Not every sprint needs every step at full intensity:

| Sprint Type | Scope | Plan | Review | Build | Verify | Ship |
|-------------|-------|------|--------|-------|--------|------|
| **Major sprint** | Founder walkthrough | README + build_plan.md | Dedicated reviewer subagent | Multi-agent with dependency waves | Post-build review agents | Full CHANGELOG + module updates |
| **Junior sprint** | Founder describes issue | README (plan optional) | Self-review | Single agent | Run app, test the fix | CHANGELOG + sprint index update |
| **Quick fix** | Obvious bug in current scope | None needed | Glance at the diff | Just fix it | Run app | CHANGELOG note |
| **Rally** | Founder defines audit scope | Two-pass analysis | Built into the process | No code — output is a plan | N/A | Rally README + proposal doc |

---

## Parallel Agent Patterns

**When to parallelize:**
- Multiple independent files/components with no shared state
- Build spec generation across different sprints
- Post-build review with multiple specialized reviewers

**When NOT to parallelize:**
- Files that import from each other
- Schema changes that later code depends on
- Anything where agent B needs the output of agent A

**Coordination rules:**
- Pre-assign file ownership before launching agents
- Pre-assign migration timestamps to avoid collisions
- One orchestrator agent coordinates; builders report back
- If an agent gets stuck, it stops and reports — doesn't improvise

**Model allocation:**
- Orchestrator: Opus (sees the full picture, makes routing decisions)
- Builders: Sonnet (fast, cheap, follows specs well when the spec is clear)
- Reviewers: Sonnet or Opus depending on complexity (Opus for architectural review, Sonnet for checklist-based review)

---

## Common Mistakes (from lessons-learned.md)

These have all happened. Check for them explicitly:

1. **Ghost columns** — referencing `users.deleted_at`, `users.subscription_plan`, or other columns that don't exist. Always check the schema.
2. **Migration collisions** — parallel agents pick the same timestamp prefix. Pre-assign timestamps.
3. **Identity mapping** — using `auth.uid()` directly on tables with separate PKs (like `recruiters`). Document the mapping pattern in the build spec.
4. **Scope creep during build** — "while I'm here, I'll also fix..." — don't. Log it as a junior sprint.
5. **CHANGELOG forgotten** — the most common mistake. Update it as you work, not at the end.
6. **Plan drift without updating the plan** — discovering something mid-build and just handling it without updating the spec. Future agents won't know what changed.
7. **Testing only the happy path** — test error states, empty states, mobile layout, dark mode tokens.

---

## Founder Approval Gates (Summary)

The founder intervenes at these points. Don't skip them:

| Gate | When | What to show |
|------|------|-------------|
| Scope confirmation | Before planning | Problem statement + proposed boundaries |
| Plan approval | Before building | README + build_plan.md |
| Agent scaling | Before launching parallel agents | Proposed agent split + file ownership |
| Fix strategy | When reviews find issues | Options with trade-offs |
| Pre-commit review | Before `git commit` (major sprints) | `git diff` + CHANGELOG entry |
| Phase gate | Before crossing phase boundaries | Summary of what shipped vs what's left |
| Rally initiation | Before starting any rally | Founder must request it — agents suggest, never self-start |
| Rally proposal | Before executing rally findings | `final_proposal.md` — founder adjusts priorities before any sprints are created |
