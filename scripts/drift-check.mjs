#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const ROOT = path.resolve(import.meta.dirname, '..')
const BASELINE_PATH = path.join(ROOT, '.drift-baseline.json')
const SOURCE_ROOTS = ['app', 'components', 'lib']
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx'])

const HOTSPOT_THRESHOLDS = [
  { lines: 600, label: 'hotspot' },
  { lines: 500, label: 'strong concern' },
  { lines: 400, label: 'split candidate' },
]

const ALLOWED_PRO_GATE_FILES = new Set([
  'lib/stripe/pro.ts',
])

const ALLOWED_ANY_FILES = new Set([
  'app/api/stripe/webhook/route.ts',
  'lib/stripe/client.ts',
])

const ALLOWED_LEGACY_CV_FILES = new Set([
  'lib/cv/save-parsed-cv-data.ts',
])

const argv = new Set(process.argv.slice(2))
const scanAll = argv.has('--all')
const updateBaseline = argv.has('--update-baseline')

const findings = {
  errors: [],
  warnings: [],
}

function run(cmd) {
  try {
    return execSync(cmd, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return ''
  }
}

function toRepoPath(filepath) {
  return filepath.split(path.sep).join('/')
}

function isSourceFile(filepath) {
  const repoPath = toRepoPath(filepath)
  const ext = path.extname(repoPath)
  return SOURCE_EXTENSIONS.has(ext) && SOURCE_ROOTS.some((root) => repoPath === root || repoPath.startsWith(`${root}/`))
}

function listAllSourceFiles(dir) {
  const absoluteDir = path.join(ROOT, dir)
  if (!fs.existsSync(absoluteDir)) return []
  const results = []

  for (const entry of fs.readdirSync(absoluteDir, { withFileTypes: true })) {
    const absolutePath = path.join(absoluteDir, entry.name)
    if (entry.isDirectory()) {
      results.push(...listAllSourceFiles(path.join(dir, entry.name)))
      continue
    }

    const repoPath = toRepoPath(path.relative(ROOT, absolutePath))
    if (isSourceFile(repoPath)) results.push(repoPath)
  }

  return results
}

function gitChangedFiles() {
  const files = new Set()
  const commands = [
    'git diff --name-only --diff-filter=ACMR',
    'git diff --cached --name-only --diff-filter=ACMR',
    'git diff --name-only main...HEAD --diff-filter=ACMR',
  ]

  for (const cmd of commands) {
    const output = run(cmd)
    if (!output) continue
    for (const line of output.split('\n')) {
      const repoPath = line.trim()
      if (!repoPath) continue
      files.add(repoPath)
    }
  }

  return [...files]
}

function lineNumberForMatch(content, matchIndex) {
  return content.slice(0, matchIndex).split('\n').length
}

function addFinding(level, type, file, line, message) {
  findings[level].push({ type, file, line, message })
}

function scanForRegex(content, file, regex, level, type, message) {
  for (const match of content.matchAll(regex)) {
    if (typeof match.index !== 'number') continue
    addFinding(level, type, file, lineNumberForMatch(content, match.index), message)
  }
}

function checkHotspot(file, content) {
  const lines = content.split('\n').length
  const threshold = HOTSPOT_THRESHOLDS.find((entry) => lines >= entry.lines)
  if (!threshold) return

  addFinding(
    'warnings',
    'hotspot',
    file,
    1,
    `Touched file is ${lines} LOC (${threshold.label}). Split or justify the concentration before merge.`
  )
}

function checkDirectProGate(file, content) {
  if (ALLOWED_PRO_GATE_FILES.has(file)) return

  scanForRegex(
    content,
    file,
    /subscription_status\s*[!=]==?\s*['"]pro['"]/g,
    'errors',
    'pro-gate',
    "Direct Pro gate found. Use getProStatus() from lib/stripe/pro.ts instead of inline subscription_status checks."
  )
}

function checkLegacyCvPath(file, content) {
  if (ALLOWED_LEGACY_CV_FILES.has(file)) return

  scanForRegex(
    content,
    file,
    /saveParsedCvData\b/g,
    'errors',
    'legacy-cv-path',
    "Legacy CV save path found. Route new work through saveConfirmedImport() and the import wizard flow instead."
  )

  scanForRegex(
    content,
    file,
    /cv_parsed_data/g,
    'errors',
    'legacy-cv-path',
    "Legacy cv_parsed_data sessionStorage path found. Do not extend the old review flow."
  )

  scanForRegex(
    content,
    file,
    /\bCvReviewClient\b/g,
    'errors',
    'legacy-cv-path',
    "Legacy CvReviewClient reference found. Do not add new work to the old review surface."
  )
}

function checkWeakTyping(file, content) {
  if (ALLOWED_ANY_FILES.has(file)) return

  scanForRegex(
    content,
    file,
    /:\s*any\b|:\s*any\[\]|Array<any>|any\[\]|\sas any\b/g,
    'warnings',
    'weak-typing',
    "Weak feature-boundary typing found. Prefer a concrete type instead of any/as any."
  )
}

function checkProtectedPageAuthFetch(file, content) {
  if (!/^app\/\(protected\)\/app\/.+\/page\.tsx$/.test(file)) return

  scanForRegex(
    content,
    file,
    /auth\.getUser\(/g,
    'warnings',
    'auth-refetch',
    "Protected child page fetches auth directly. The protected layout should usually own auth; verify this page really needs another getUser() call."
  )
}

// --- Baseline support ---

function loadBaseline() {
  if (!fs.existsSync(BASELINE_PATH)) return null
  try {
    return JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'))
  } catch {
    console.warn('drift-check: could not parse .drift-baseline.json, ignoring baseline.')
    return null
  }
}

function buildBaselineCounts(findingsList) {
  const counts = {}
  for (const item of findingsList) {
    const key = item.file
    if (!counts[key]) counts[key] = {}
    counts[key][item.type] = (counts[key][item.type] || 0) + 1
  }
  return counts
}

function saveBaseline(errorFindings, warningFindings) {
  const baseline = {
    generated: new Date().toISOString().slice(0, 10),
    errors: buildBaselineCounts(errorFindings),
    warnings: buildBaselineCounts(warningFindings),
  }
  fs.writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + '\n')
  return baseline
}

function subtractBaseline(findingsList, baselineCounts) {
  // Count how many of each file+type combo the baseline allows.
  // Subtract that many from the findings, keeping only the excess.
  const remaining = []
  const budget = {}

  for (const [file, types] of Object.entries(baselineCounts)) {
    budget[file] = { ...types }
  }

  for (const item of findingsList) {
    const fileBudget = budget[item.file]
    if (fileBudget && fileBudget[item.type] > 0) {
      fileBudget[item.type]--
      continue // suppressed by baseline
    }
    remaining.push(item)
  }

  return remaining
}

function printFindings(level, items) {
  if (items.length === 0) return
  const heading = level === 'errors' ? 'Errors' : 'Warnings'
  console.log(`\n${heading}`)
  console.log('-'.repeat(heading.length))

  for (const item of items) {
    console.log(`${item.file}:${item.line} [${item.type}] ${item.message}`)
  }
}

function uniqueSorted(items) {
  return [...new Set(items)].sort((a, b) => a.localeCompare(b))
}

// --- Main ---

const files = uniqueSorted(
  scanAll || updateBaseline
    ? SOURCE_ROOTS.flatMap(listAllSourceFiles)
    : gitChangedFiles().filter(isSourceFile)
)

if (files.length === 0) {
  console.log('drift-check: no changed source files to scan.')
  process.exit(0)
}

for (const file of files) {
  const absolutePath = path.join(ROOT, file)
  if (!fs.existsSync(absolutePath)) continue

  const content = fs.readFileSync(absolutePath, 'utf8')

  checkHotspot(file, content)
  checkDirectProGate(file, content)
  checkLegacyCvPath(file, content)
  checkWeakTyping(file, content)
  checkProtectedPageAuthFetch(file, content)
}

// Handle --update-baseline: write counts and exit
if (updateBaseline) {
  const baseline = saveBaseline(findings.errors, findings.warnings)
  const errorCount = findings.errors.length
  const warningCount = findings.warnings.length
  console.log(`drift-check: scanned ${files.length} source file${files.length === 1 ? '' : 's'}.`)
  console.log(`Baseline updated: ${errorCount} error${errorCount === 1 ? '' : 's'}, ${warningCount} warning${warningCount === 1 ? '' : 's'} recorded in .drift-baseline.json`)
  process.exit(0)
}

// Apply baseline suppression if a baseline exists
const baseline = loadBaseline()
let suppressed = { errors: 0, warnings: 0 }

let reportErrors = findings.errors
let reportWarnings = findings.warnings

if (baseline) {
  reportErrors = subtractBaseline(findings.errors, baseline.errors || {})
  reportWarnings = subtractBaseline(findings.warnings, baseline.warnings || {})
  suppressed.errors = findings.errors.length - reportErrors.length
  suppressed.warnings = findings.warnings.length - reportWarnings.length
}

console.log(`drift-check: scanned ${files.length} source file${files.length === 1 ? '' : 's'}.`)
if (baseline && (suppressed.errors > 0 || suppressed.warnings > 0)) {
  console.log(`Baseline: ${suppressed.errors} error${suppressed.errors === 1 ? '' : 's'}, ${suppressed.warnings} warning${suppressed.warnings === 1 ? '' : 's'} suppressed (from ${baseline.generated} baseline).`)
}
printFindings('errors', reportErrors)
printFindings('warnings', reportWarnings)

if (reportErrors.length > 0) {
  console.log(`\nResult: FAIL (${reportErrors.length} new error${reportErrors.length === 1 ? '' : 's'}, ${reportWarnings.length} new warning${reportWarnings.length === 1 ? '' : 's'})`)
  process.exit(1)
}

console.log(`\nResult: PASS (${reportWarnings.length} new warning${reportWarnings.length === 1 ? '' : 's'})`)
