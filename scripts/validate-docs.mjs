#!/usr/bin/env node

/**
 * YachtieLink Documentation Validator
 *
 * Checks module state files, sprint status, session logs, and cross-references.
 * Generates STATUS.md and VALIDATION.md at the project root.
 *
 * Usage: node scripts/validate-docs.mjs
 */

import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const MODULES_DIR = path.join(ROOT, 'docs', 'modules')
const SESSIONS_DIR = path.join(ROOT, 'sessions')
const SPRINTS_DIR = path.join(ROOT, 'sprints')
const OPS_DIR = path.join(ROOT, 'docs', 'ops')

const warnings = []
const errors = []

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readFile(filepath) {
  try { return fs.readFileSync(filepath, 'utf-8') } catch { return null }
}

function parseFrontmatter(content) {
  if (!content) return null
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return null
  const fm = {}
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    let val = line.slice(idx + 1).trim()
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val.slice(1, -1).split(',').map(s => s.trim())
    }
    fm[key] = val
  }
  return fm
}

function daysSince(dateStr) {
  if (!dateStr) return Infinity
  const d = new Date(dateStr)
  if (isNaN(d)) return Infinity
  return Math.floor((Date.now() - d.getTime()) / 86400000)
}

function fileExists(filepath) {
  return fs.existsSync(filepath)
}

function listMdFiles(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir).filter(f => f.endsWith('.md') && !f.startsWith('.'))
}

// ─── 1. Module State Files ───────────────────────────────────────────────────

const MODULE_NAMES = [
  'auth', 'profile', 'employment', 'endorsements', 'public-profile',
  'onboarding', 'payments', 'analytics', 'network', 'design-system', 'infrastructure'
]

const moduleData = []

for (const mod of MODULE_NAMES) {
  const stateFile = path.join(MODULES_DIR, `${mod}.md`)
  const decisionsFile = path.join(MODULES_DIR, `${mod}.decisions.md`)
  const activityFile = path.join(MODULES_DIR, `${mod}.activity.md`)

  const content = readFile(stateFile)
  if (!content) {
    errors.push(`Module state file missing: docs/modules/${mod}.md`)
    moduleData.push({ module: mod, status: 'MISSING', updated: '—', phase: '—', issues: 0 })
    continue
  }

  const fm = parseFrontmatter(content)
  if (!fm) {
    warnings.push(`Module ${mod}: missing frontmatter`)
  }

  const updated = fm?.updated || '—'
  const status = fm?.status || 'unknown'
  const phase = fm?.phase || '—'
  const age = daysSince(updated)

  if (age > 30) {
    warnings.push(`docs/modules/${mod}.md — updated ${updated} (${age} days ago, stale)`)
  } else if (age > 14) {
    warnings.push(`docs/modules/${mod}.md — updated ${updated} (${age} days ago, approaching stale)`)
  }

  // Count known issues from Current State section
  const issueMatches = content.match(/known issue|bug|broken|partial|TODO|FIXME/gi)
  const issueCount = issueMatches ? issueMatches.length : 0

  if (!fileExists(decisionsFile)) {
    warnings.push(`Missing decisions log: docs/modules/${mod}.decisions.md`)
  }
  if (!fileExists(activityFile)) {
    warnings.push(`Missing activity log: docs/modules/${mod}.activity.md`)
  }

  moduleData.push({ module: mod, status, updated, phase, issues: issueCount })
}

// ─── 2. Operational Files ────────────────────────────────────────────────────

for (const file of ['lessons-learned.md', 'feedback.md']) {
  if (!fileExists(path.join(OPS_DIR, file))) {
    errors.push(`Missing operational file: docs/ops/${file}`)
  }
}

// ─── 3. Sprint Status ───────────────────────────────────────────────────────

const sprintReadme = readFile(path.join(SPRINTS_DIR, 'README.md'))
if (!sprintReadme) {
  warnings.push('sprints/README.md missing')
}

// ─── 4. Session Log Hygiene ──────────────────────────────────────────────────

const sessionFiles = listMdFiles(SESSIONS_DIR).filter(f => f !== 'README.md')
for (const file of sessionFiles) {
  const content = readFile(path.join(SESSIONS_DIR, file))
  if (!content) continue

  const fm = parseFrontmatter(content)
  if (!fm) {
    warnings.push(`Session log ${file}: missing frontmatter`)
  }

  if (!content.includes('## Summary')) {
    warnings.push(`Session log ${file}: missing ## Summary section`)
  }
  if (!content.includes('## Session Log')) {
    warnings.push(`Session log ${file}: missing ## Session Log section`)
  }

  const timestamps = content.match(/^\*\*\d{1,2}:\d{2}\*\*/gm)
  if (!timestamps || timestamps.length < 3) {
    warnings.push(`Session log ${file}: fewer than 3 timestamped entries (has ${timestamps?.length || 0})`)
  }
}

// ─── 5. CHANGELOG Freshness ─────────────────────────────────────────────────

const changelog = readFile(path.join(ROOT, 'CHANGELOG.md'))
if (changelog) {
  const dateMatch = changelog.match(/^## (\d{4}-\d{2}-\d{2})/m)
  if (dateMatch) {
    const age = daysSince(dateMatch[1])
    if (age > 7) {
      warnings.push(`CHANGELOG.md last entry is ${age} days old`)
    }
  }
}

// ─── 6. Recent Activity (from activity logs) ────────────────────────────────

const recentActivity = []
for (const mod of MODULE_NAMES) {
  const activityFile = path.join(MODULES_DIR, `${mod}.activity.md`)
  const content = readFile(activityFile)
  if (!content) continue

  // Find most recent entry
  const entries = content.match(/^\*\*(\d{4}-\d{2}-\d{2})\*\* — (.+)/gm)
  if (entries && entries.length > 0) {
    const latest = entries[0] // newest at top
    const dateMatch = latest.match(/^\*\*(\d{4}-\d{2}-\d{2})\*\*/)
    const textMatch = latest.match(/^\*\*\d{4}-\d{2}-\d{2}\*\* — (.+)/)
    if (dateMatch && textMatch && daysSince(dateMatch[1]) <= 14) {
      recentActivity.push({ date: dateMatch[1], module: mod, summary: textMatch[1].slice(0, 120) })
    }
  }
}
recentActivity.sort((a, b) => b.date.localeCompare(a.date))

// ─── 7. Lessons Learned (latest 5) ──────────────────────────────────────────

const lessonsFile = readFile(path.join(OPS_DIR, 'lessons-learned.md'))
const lessonTitles = []
if (lessonsFile) {
  const matches = lessonsFile.match(/^## .+/gm)
  if (matches) {
    for (const m of matches.slice(0, 5)) {
      lessonTitles.push(m.replace('## ', ''))
    }
  }
}

// ─── 8. Read system state for phase info ─────────────────────────────────────

let currentPhase = 'Unknown'
const sysState = readFile(path.join(ROOT, 'docs', 'yl_system_state.json'))
if (sysState) {
  try {
    const parsed = JSON.parse(sysState)
    currentPhase = parsed.project?.current_phase || parsed.current_build_target?.phase || 'Unknown'
  } catch { /* ignore */ }
}

// ─── Generate STATUS.md ──────────────────────────────────────────────────────

const now = new Date().toISOString().slice(0, 16).replace('T', ' ')

let status = `# YachtieLink — Project Status

Auto-generated by \`npm run validate-docs\`. Do not hand-edit.

**Generated:** ${now}

## Current Phase

${currentPhase}

## Module Status

| Module | Status | Last Updated | Issues | Phase |
|--------|--------|-------------|--------|-------|
`

for (const m of moduleData) {
  status += `| ${m.module} | ${m.status} | ${m.updated} | ${m.issues} | ${m.phase} |\n`
}

if (recentActivity.length > 0) {
  status += `\n## Recent Activity (Last 14 Days)\n\n`
  status += `| Date | Module | Summary |\n|------|--------|---------|\n`
  for (const a of recentActivity.slice(0, 15)) {
    status += `| ${a.date} | ${a.module} | ${a.summary} |\n`
  }
}

if (lessonTitles.length > 0) {
  status += `\n## Latest Lessons Learned\n\n`
  for (const l of lessonTitles) {
    status += `- ${l}\n`
  }
}

status += `\n---\n*See docs/modules/ for full module state. See docs/ops/ for operational knowledge.*\n`

fs.writeFileSync(path.join(ROOT, 'STATUS.md'), status)

// ─── Generate VALIDATION.md ──────────────────────────────────────────────────

let validation = `# Validation Report

Auto-generated by \`npm run validate-docs\`. Do not hand-edit.

**Generated:** ${now}

## Errors (${errors.length})

`

if (errors.length === 0) {
  validation += 'None.\n'
} else {
  for (const e of errors) validation += `- ${e}\n`
}

validation += `\n## Warnings (${warnings.length})\n\n`

if (warnings.length === 0) {
  validation += 'None.\n'
} else {
  for (const w of warnings) validation += `- ${w}\n`
}

validation += `\n## Module Coverage\n\n`
validation += `| Module | State File | Decisions | Activity | Status |\n`
validation += `|--------|-----------|-----------|----------|--------|\n`

for (const mod of MODULE_NAMES) {
  const hasState = fileExists(path.join(MODULES_DIR, `${mod}.md`))
  const hasDecisions = fileExists(path.join(MODULES_DIR, `${mod}.decisions.md`))
  const hasActivity = fileExists(path.join(MODULES_DIR, `${mod}.activity.md`))
  const fm = hasState ? parseFrontmatter(readFile(path.join(MODULES_DIR, `${mod}.md`))) : null
  validation += `| ${mod} | ${hasState ? 'Yes' : '**MISSING**'} | ${hasDecisions ? 'Yes' : '**MISSING**'} | ${hasActivity ? 'Yes' : '**MISSING**'} | ${fm?.status || '—'} |\n`
}

fs.writeFileSync(path.join(ROOT, 'VALIDATION.md'), validation)

// ─── Console Output ──────────────────────────────────────────────────────────

console.log(`\n  YachtieLink Doc Validation`)
console.log(`  ─────────────────────────`)
console.log(`  Errors:   ${errors.length}`)
console.log(`  Warnings: ${warnings.length}`)
console.log(`  Modules:  ${moduleData.filter(m => m.status !== 'MISSING').length}/${MODULE_NAMES.length}`)
console.log(`  Generated: STATUS.md, VALIDATION.md\n`)

if (errors.length > 0) {
  console.log('  Errors:')
  for (const e of errors) console.log(`    ✗ ${e}`)
  console.log()
}
if (warnings.length > 0) {
  console.log('  Warnings:')
  for (const w of warnings) console.log(`    ⚠ ${w}`)
  console.log()
}

process.exit(errors.length > 0 ? 1 : 0)
