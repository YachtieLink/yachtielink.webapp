"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WizardProps {
  userId: string;
  initialData: {
    full_name: string | null;
    display_name: string | null;
    handle: string | null;
    departments: string[] | null;
    primary_role: string | null;
  };
}

interface YachtResult {
  id: string;
  name: string;
  yacht_type: string | null;
  size_category: string | null;
  length_meters: number | null;
}

interface Department {
  id: string;
  name: string;
  sort_order: number;
}

interface Role {
  id: string;
  name: string;
  department: string;
  is_senior: boolean;
  sort_order: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  "name",
  "handle",
  "role",
  "yacht",
  "endorsements",
  "done",
] as const;
type Step = (typeof STEPS)[number];

const HANDLE_REGEX = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;

const YACHT_TYPES = ["Motor Yacht", "Sailing Yacht"] as const;

const SIZE_CATEGORIES = [
  { value: "small", label: "Small (< 24m)" },
  { value: "medium", label: "Medium (24–40m)" },
  { value: "large", label: "Large (40–60m)" },
  { value: "superyacht", label: "Superyacht (60m+)" },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStartingStep(data: WizardProps["initialData"]): number {
  if (!data.full_name) return 0;
  if (!data.handle) return 1;
  if (!data.departments?.length || !data.primary_role) return 2;
  return 3;
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <div className="flex items-center gap-1.5 px-6 pt-6">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
            i < current
              ? "bg-[var(--color-navy-800)]"
              : i === current
                ? "bg-[var(--color-navy-800)] opacity-50"
                : "bg-[var(--color-border)]"
          }`}
        />
      ))}
    </div>
  );
}

// ─── Step Shell ───────────────────────────────────────────────────────────────

function StepShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-sm text-[var(--color-text-tertiary)]">
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Step 1: Name ─────────────────────────────────────────────────────────────

function StepName({
  initialFullName,
  initialDisplayName,
  onNext,
}: {
  initialFullName: string;
  initialDisplayName: string;
  onNext: (data: { full_name: string; display_name: string }) => void;
}) {
  const [fullName, setFullName] = useState(initialFullName);
  const [displayName, setDisplayName] = useState(initialDisplayName);

  function handleNext() {
    if (!fullName.trim()) return;
    const dn =
      displayName.trim() || fullName.trim().split(" ")[0];
    onNext({ full_name: fullName.trim(), display_name: dn });
  }

  return (
    <StepShell
      title="What's your name?"
      subtitle="This appears on your profile and endorsements."
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Full name"
          placeholder="e.g. James Harrison"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoComplete="name"
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && handleNext()}
        />
        <Input
          label="Display name (optional)"
          placeholder={fullName.trim().split(" ")[0] || "e.g. James"}
          hint="How you'd like to be called — defaults to your first name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleNext()}
        />
      </div>
      <Button
        onClick={handleNext}
        disabled={!fullName.trim()}
        className="w-full"
        size="lg"
      >
        Continue
      </Button>
    </StepShell>
  );
}

// ─── Step 2: Handle ───────────────────────────────────────────────────────────

function StepHandle({
  fullName,
  initialHandle,
  onNext,
}: {
  fullName: string;
  initialHandle: string;
  onNext: (data: { handle: string }) => void;
}) {
  const [handle, setHandle] = useState(initialHandle);
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [formatError, setFormatError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = createClient();

  const checkHandle = useCallback(
    async (value: string) => {
      setFormatError("");
      setSuggestions([]);

      if (!value) {
        setAvailable(null);
        setChecking(false);
        return;
      }

      if (!HANDLE_REGEX.test(value)) {
        setAvailable(false);
        setChecking(false);
        setFormatError(
          "3–30 characters: lowercase letters, numbers, and hyphens only (must start and end with a letter or number)"
        );
        return;
      }

      const { data: isAvailable } = await supabase.rpc("handle_available", {
        p_handle: value,
      });
      setChecking(false);
      setAvailable(isAvailable as boolean);

      if (!isAvailable) {
        const { data: suggests } = await supabase.rpc("suggest_handles", {
          p_full_name: fullName,
        });
        setSuggestions((suggests as string[]) ?? []);
      }
    },
    [fullName, supabase]
  );

  function handleChange(raw: string) {
    // Normalise on the fly: lowercase, spaces → hyphens
    const value = raw.toLowerCase().replace(/\s/g, "-");
    setHandle(value);
    setAvailable(null);
    setFormatError("");
    setSuggestions([]);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value) {
      setChecking(true);
      debounceRef.current = setTimeout(() => checkHandle(value), 450);
    } else {
      setChecking(false);
    }
  }

  const isValid = available === true && HANDLE_REGEX.test(handle);

  return (
    <StepShell
      title="Choose your handle"
      subtitle="Your unique @username on YachtieLink. You can change it later."
    >
      <div className="flex flex-col gap-3">
        <div className="relative">
          {/* Leading @ prefix */}
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-tertiary)]">
            @
          </span>
          <input
            className={`h-12 w-full rounded-xl border pl-8 pr-4 text-sm
              bg-[var(--color-surface)] text-[var(--color-text-primary)]
              placeholder:text-[var(--color-text-tertiary)]
              focus:outline-none focus:ring-2 transition-colors
              ${
                formatError || available === false
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                  : available === true
                    ? "border-green-500 focus:border-green-500 focus:ring-green-500/20"
                    : "border-[var(--color-border)] focus:border-[var(--color-interactive)] focus:ring-[var(--color-interactive)]/20"
              }`}
            placeholder="james-harrison"
            value={handle}
            onChange={(e) => handleChange(e.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && isValid && onNext({ handle })}
          />
        </div>

        {/* Status messages */}
        {checking && (
          <p className="text-xs text-[var(--color-text-tertiary)]">
            Checking availability…
          </p>
        )}
        {!checking && available === true && (
          <p className="text-xs text-green-600">@{handle} is available ✓</p>
        )}
        {!checking && (formatError || available === false) && (
          <p className="text-xs text-red-600">
            {formatError || "That handle is already taken"}
          </p>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-[var(--color-text-tertiary)]">
              Try one of these:
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setHandle(s);
                    setAvailable(true);
                    setSuggestions([]);
                    setFormatError("");
                  }}
                  className="rounded-full border border-[var(--color-border)] px-3 py-1 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors"
                >
                  @{s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <Button
        onClick={() => onNext({ handle })}
        disabled={!isValid}
        className="w-full"
        size="lg"
      >
        Continue
      </Button>
    </StepShell>
  );
}

// ─── Step 3: Role ─────────────────────────────────────────────────────────────

function RoleRow({
  role,
  selected,
  onSelect,
}: {
  role: Role;
  selected: boolean;
  onSelect: (name: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(role.name)}
      className={`flex w-full items-center gap-3 border-b border-[var(--color-border)] px-4 py-3 text-left text-sm last:border-b-0 transition-colors ${
        selected
          ? "bg-[var(--color-navy-800)] text-white"
          : "text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]"
      }`}
    >
      <span className={role.is_senior ? "font-semibold" : ""}>{role.name}</span>
      {role.is_senior && (
        <span className={`ml-auto text-xs ${selected ? "text-white/60" : "text-[var(--color-text-tertiary)]"}`}>
          Senior
        </span>
      )}
    </button>
  );
}

function StepRole({
  userId,
  initialDepartments,
  initialPrimaryRole,
  onNext,
}: {
  userId: string;
  initialDepartments: string[];
  initialPrimaryRole: string;
  onNext: (data: { departments: string[]; primary_role: string }) => void;
}) {
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>(initialDepartments[0] ?? "");
  const [selectedRole, setSelectedRole] = useState(initialPrimaryRole);
  const [roleSearch, setRoleSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const [{ data: depts }, { data: roleList }] = await Promise.all([
        supabase.from("departments").select("*").order("sort_order"),
        supabase.from("roles").select("*").order("sort_order"),
      ]);
      setAllDepartments((depts as Department[]) ?? []);
      setAllRoles((roleList as Role[]) ?? []);
      setLoading(false);
    }
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const searchTerm = roleSearch.toLowerCase().trim();
  // Default list: roles in selected dept only (sort_order = popular first).
  // When searching: cast net across all roles so specialists surface too.
  const displayRoles = searchTerm
    ? allRoles.filter((r) => r.name.toLowerCase().includes(searchTerm))
    : allRoles.filter((r) => r.department === selectedDept);
  const noResults = searchTerm.length > 0 && displayRoles.length === 0;

  function selectDept(name: string) {
    setSelectedDept(name);
    setSelectedRole("");
    setRoleSearch("");
  }

  function handleSelectRole(name: string) {
    setSelectedRole(name);
    setRoleSearch(""); // clear search so selected role is visible in full list
  }

  function handleUseCustom() {
    setSelectedRole(roleSearch.trim());
    // Keep roleSearch so the "Use X" row stays visible + highlighted
  }

  const canContinue = selectedDept.length > 0 && selectedRole.length > 0;

  async function handleNext() {
    const isCustom = !allRoles.some((r) => r.name === selectedRole);
    if (isCustom) {
      try {
        await supabase.from("other_role_entries").insert({
          value: selectedRole,
          department: selectedDept || "Other",
          submitted_by: userId,
        });
      } catch {
        // Non-critical — onboarding continues regardless
      }
    }
    onNext({ departments: [selectedDept], primary_role: selectedRole });
  }

  if (loading) {
    return (
      <StepShell title="What's your role?">
        <div className="flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-navy-800)] border-t-transparent" />
        </div>
      </StepShell>
    );
  }

  return (
    <StepShell
      title="What's your role?"
      subtitle="Select your department and primary role on board."
    >
      <div className="flex flex-col gap-5">
        {/* Department chips — single select */}
        <div>
          <p className="mb-2.5 text-sm font-medium text-[var(--color-text-primary)]">
            Department
          </p>
          <div className="flex flex-wrap gap-2">
            {allDepartments.map((d) => (
              <button
                key={d.name}
                onClick={() => selectDept(d.name)}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  selectedDept === d.name
                    ? "border-[var(--color-navy-800)] bg-[var(--color-navy-800)] text-white"
                    : "border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]"
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>

        {/* Role search + list — shown once a department is chosen */}
        {selectedDept && (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              Primary role
            </p>

            <Input
              placeholder="Search for your role…"
              value={roleSearch}
              onChange={(e) => {
                setRoleSearch(e.target.value);
                setSelectedRole("");
              }}
            />

            <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
              {displayRoles.map((r) => (
                <RoleRow key={r.id} role={r} selected={selectedRole === r.name} onSelect={handleSelectRole} />
              ))}

              {/* No matches — let them use whatever they typed */}
              {noResults && (
                <button
                  onClick={handleUseCustom}
                  className={`flex w-full items-center px-4 py-3 text-left text-sm transition-colors ${
                    selectedRole === roleSearch.trim()
                      ? "bg-[var(--color-navy-800)] text-white"
                      : "text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]"
                  }`}
                >
                  Use &ldquo;{roleSearch.trim()}&rdquo; as my role
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <Button onClick={handleNext} disabled={!canContinue} className="w-full" size="lg">
        Continue
      </Button>
    </StepShell>
  );
}

// ─── Step 4: Yacht ────────────────────────────────────────────────────────────

function StepYacht({
  userId,
  primaryRole,
  onNext,
  onSkip,
}: {
  userId: string;
  primaryRole: string;
  onNext: (data: { yacht_id: string; yacht_name: string }) => void;
  onSkip: () => void;
}) {
  const [mode, setMode] = useState<"search" | "create">("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<YachtResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  // Create form state
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"Motor Yacht" | "Sailing Yacht">(
    "Motor Yacht"
  );
  const [newSize, setNewSize] = useState<
    "small" | "medium" | "large" | "superyacht"
  >("medium");
  const [newLength, setNewLength] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = createClient();

  async function searchYachts(q: string) {
    if (!q.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const { data } = await supabase
      .from("yachts")
      .select("id, name, yacht_type, size_category, length_meters")
      .ilike("name", `%${q}%`)
      .limit(8);
    setResults((data as YachtResult[]) ?? []);
    setSearching(false);
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchYachts(value), 300);
  }

  async function createAttachment(yachtId: string) {
    await supabase.from("attachments").insert({
      user_id: userId,
      yacht_id: yachtId,
      role_label: primaryRole,
      started_at: new Date().toISOString().split("T")[0],
    });
  }

  async function selectYacht(yacht: YachtResult) {
    setSaving(true);
    await createAttachment(yacht.id);
    setSaving(false);
    onNext({ yacht_id: yacht.id, yacht_name: yacht.name });
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    setSaving(true);
    const { data: yacht, error } = await supabase
      .from("yachts")
      .insert({
        name: newName.trim(),
        yacht_type: newType,
        size_category: newSize,
        ...(newLength ? { length_meters: parseFloat(newLength) } : {}),
        created_by: userId,
      })
      .select("id, name")
      .single();

    if (!error && yacht) {
      await createAttachment(yacht.id);
      setSaving(false);
      onNext({ yacht_id: yacht.id, yacht_name: yacht.name });
    } else {
      setSaving(false);
    }
  }

  return (
    <StepShell
      title="Which yacht are you on?"
      subtitle="Add your current or most recent vessel. You can add more from your profile."
    >
      {/* Mode toggle */}
      <div className="flex gap-2">
        {(["search", "create"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-colors ${
              mode === m
                ? "border-[var(--color-navy-800)] bg-[var(--color-navy-800)] text-white"
                : "border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]"
            }`}
          >
            {m === "search" ? "Search" : "Add new"}
          </button>
        ))}
      </div>

      {mode === "search" ? (
        <div className="flex flex-col gap-3">
          <Input
            placeholder="Search by yacht name…"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            autoFocus
          />

          {searching && (
            <div className="flex justify-center py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-navy-800)] border-t-transparent" />
            </div>
          )}

          {!searching && results.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
              {results.map((y) => (
                <button
                  key={y.id}
                  onClick={() => selectYacht(y)}
                  disabled={saving}
                  className="flex w-full items-start gap-3 border-b border-[var(--color-border)] px-4 py-3 text-left last:border-b-0 hover:bg-[var(--color-surface-raised)] transition-colors disabled:opacity-60"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                      {y.name}
                    </p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      {[
                        y.yacht_type,
                        y.size_category,
                        y.length_meters ? `${y.length_meters}m` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!searching && query.trim() && results.length === 0 && (
            <div className="rounded-xl border border-[var(--color-border)] px-4 py-6 text-center">
              <p className="text-sm text-[var(--color-text-tertiary)]">
                No yachts found for &ldquo;{query}&rdquo;
              </p>
              <button
                onClick={() => {
                  setNewName(query);
                  setMode("create");
                }}
                className="mt-2 text-sm text-[var(--color-interactive)] underline underline-offset-2"
              >
                Add it as a new yacht →
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Input
            label="Yacht name"
            placeholder="e.g. Lady Tara"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--color-text-primary)]">
              Type
            </label>
            <div className="flex gap-2">
              {YACHT_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setNewType(t)}
                  className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-colors ${
                    newType === t
                      ? "border-[var(--color-navy-800)] bg-[var(--color-navy-800)] text-white"
                      : "border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--color-text-primary)]">
              Size
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SIZE_CATEGORIES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setNewSize(s.value)}
                  className={`rounded-xl border py-2.5 text-sm font-medium transition-colors ${
                    newSize === s.value
                      ? "border-[var(--color-navy-800)] bg-[var(--color-navy-800)] text-white"
                      : "border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Length (m)"
            placeholder="e.g. 45"
            type="number"
            min="1"
            value={newLength}
            onChange={(e) => setNewLength(e.target.value)}
            hint="Optional"
          />

          <Button
            onClick={handleCreate}
            disabled={!newName.trim()}
            loading={saving}
            className="w-full"
            size="lg"
          >
            Add Yacht & Continue
          </Button>
        </div>
      )}

      <button
        onClick={onSkip}
        className="w-full text-center text-sm text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-text-primary)]"
      >
        Skip for now
      </button>
    </StepShell>
  );
}

// ─── Step 5: Endorsements ─────────────────────────────────────────────────────

function StepEndorsements({
  userId,
  yachtId,
  yachtName,
  onNext,
  onSkip,
}: {
  userId: string;
  yachtId: string | null;
  yachtName: string;
  onNext: () => void;
  onSkip: () => void;
}) {
  const [emails, setEmails] = useState<string[]>([""]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  // If there's no yacht we can't create requests — skip ahead
  if (!yachtId) {
    return (
      <StepShell
        title="Invite colleagues"
        subtitle="Once you've added a yacht, you can request endorsements from your fellow crew."
      >
        <Button onClick={onSkip} className="w-full" size="lg">
          Continue to your profile
        </Button>
      </StepShell>
    );
  }

  function addEmail() {
    if (emails.length < 5) setEmails([...emails, ""]);
  }

  function updateEmail(i: number, value: string) {
    const next = [...emails];
    next[i] = value;
    setEmails(next);
  }

  function removeEmail(i: number) {
    setEmails(emails.filter((_, idx) => idx !== i));
  }

  const validEmails = emails.filter(
    (e) => e.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim())
  );

  async function handleSend() {
    if (validEmails.length === 0) {
      onNext();
      return;
    }
    setSending(true);
    await Promise.allSettled(
      validEmails.map((email) =>
        fetch("/api/endorsement-requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            yacht_id: yachtId,
            recipient_email: email.trim(),
            yacht_name: yachtName,
          }),
        })
      )
    );
    setSending(false);
    setSent(true);
    setTimeout(() => onNext(), 1200);
  }

  if (sent) {
    return (
      <StepShell title="Invites sent! 🎉">
        <p className="text-sm text-[var(--color-text-tertiary)]">
          Your colleagues will receive a link to endorse you on{" "}
          <strong>{yachtName}</strong>.
        </p>
      </StepShell>
    );
  }

  return (
    <StepShell
      title="Invite colleagues"
      subtitle={`Ask your fellow crew on ${yachtName} to endorse your work.`}
    >
      <div className="flex flex-col gap-3">
        {emails.map((email, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                type="email"
                placeholder="colleague@email.com"
                value={email}
                onChange={(e) => updateEmail(i, e.target.value)}
                autoFocus={i === 0}
              />
            </div>
            {emails.length > 1 && (
              <button
                onClick={() => removeEmail(i)}
                className="shrink-0 text-[var(--color-text-tertiary)] transition-colors hover:text-red-500"
                aria-label="Remove email"
              >
                ✕
              </button>
            )}
          </div>
        ))}

        {emails.length < 5 && (
          <button
            onClick={addEmail}
            className="text-left text-sm text-[var(--color-interactive)] hover:underline"
          >
            + Add another colleague
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <Button
          onClick={handleSend}
          disabled={validEmails.length === 0}
          loading={sending}
          className="w-full"
          size="lg"
        >
          Send{" "}
          {validEmails.length > 0
            ? `${validEmails.length} invite${validEmails.length > 1 ? "s" : ""}`
            : "Invites"}
        </Button>
        <button
          onClick={onSkip}
          className="w-full text-center text-sm text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-text-primary)]"
        >
          Skip for now
        </button>
      </div>
    </StepShell>
  );
}

// ─── Step 6: Done ─────────────────────────────────────────────────────────────

function StepDone({
  firstName,
  handle,
}: {
  firstName: string;
  handle: string;
}) {
  return (
    <StepShell title={`Welcome aboard, ${firstName}! 🎉`}>
      <div className="flex flex-col gap-3 text-sm text-[var(--color-text-tertiary)]">
        <p>Your profile is all set. Here&apos;s what you can do next:</p>
        <ul className="space-y-2 pl-1">
          <li>
            🔗 Your public link:{" "}
            <strong className="text-[var(--color-text-primary)]">
              yachtielink.com/u/{handle}
            </strong>
          </li>
          <li>📋 Build your CV in the CV tab</li>
          <li>⭐ Endorsements appear in the Audience tab</li>
        </ul>
      </div>

      <div className="flex flex-col items-center gap-2 pt-2">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--color-navy-800)] border-t-transparent" />
        <p className="text-xs text-[var(--color-text-tertiary)]">
          Taking you to your profile…
        </p>
      </div>
    </StepShell>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export function Wizard({ userId, initialData }: WizardProps) {
  const router = useRouter();
  const supabase = createClient();

  const [stepIndex, setStepIndex] = useState(() =>
    getStartingStep(initialData)
  );

  // Accumulated form data
  const [fullName, setFullName] = useState(initialData.full_name ?? "");
  const [displayName, setDisplayName] = useState(
    initialData.display_name ?? ""
  );
  const [handle, setHandle] = useState(initialData.handle ?? "");
  const [departments, setDepartments] = useState<string[]>(
    initialData.departments ?? []
  );
  const [primaryRole, setPrimaryRole] = useState(
    initialData.primary_role ?? ""
  );
  const [yachtId, setYachtId] = useState<string | null>(null);
  const [yachtName, setYachtName] = useState("");

  const VISIBLE_STEPS = STEPS.length - 1; // exclude "done" from progress count

  async function saveToDb(updates: Record<string, unknown>) {
    await supabase.from("users").update(updates).eq("id", userId);
  }

  // ── Step handlers ────────────────────────────────────────────────────────

  async function handleNameNext(data: {
    full_name: string;
    display_name: string;
  }) {
    setFullName(data.full_name);
    setDisplayName(data.display_name);
    await saveToDb({
      full_name: data.full_name,
      display_name: data.display_name,
    });
    setStepIndex(1);
  }

  async function handleHandleNext(data: { handle: string }) {
    setHandle(data.handle);
    await saveToDb({ handle: data.handle });
    setStepIndex(2);
  }

  async function handleRoleNext(data: {
    departments: string[];
    primary_role: string;
  }) {
    setDepartments(data.departments);
    setPrimaryRole(data.primary_role);
    await saveToDb({
      departments: data.departments,
      primary_role: data.primary_role,
    });
    setStepIndex(3);
  }

  function handleYachtNext(data: { yacht_id: string; yacht_name: string }) {
    setYachtId(data.yacht_id);
    setYachtName(data.yacht_name);
    setStepIndex(4);
  }

  function handleYachtSkip() {
    // No yacht added — skip endorsements too (they require a yacht_id)
    handleDone();
  }

  function handleEndorsementsNext() {
    handleDone();
  }

  function handleEndorsementsSkip() {
    handleDone();
  }

  async function handleDone() {
    await saveToDb({ onboarding_complete: true });
    setStepIndex(5);
    setTimeout(() => router.push("/app/profile"), 2200);
  }

  const currentStep = STEPS[stepIndex];
  const firstName = fullName.split(" ")[0] || "there";

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col">
      {/* Progress bar — hidden on the Done screen */}
      {stepIndex < VISIBLE_STEPS && (
        <>
          <ProgressBar current={stepIndex} total={VISIBLE_STEPS} />
          <div className="px-6 pt-3">
            <p className="text-xs font-medium uppercase tracking-widest text-[var(--color-text-tertiary)]">
              Step {stepIndex + 1} of {VISIBLE_STEPS}
            </p>
          </div>
        </>
      )}

      {/* Step content */}
      <div className="flex-1 px-6 py-8">
        {currentStep === "name" && (
          <StepName
            initialFullName={fullName}
            initialDisplayName={displayName}
            onNext={handleNameNext}
          />
        )}

        {currentStep === "handle" && (
          <StepHandle
            fullName={fullName}
            initialHandle={handle}
            onNext={handleHandleNext}
          />
        )}

        {currentStep === "role" && (
          <StepRole
            userId={userId}
            initialDepartments={departments}
            initialPrimaryRole={primaryRole}
            onNext={handleRoleNext}
          />
        )}

        {currentStep === "yacht" && (
          <StepYacht
            userId={userId}
            primaryRole={primaryRole}
            onNext={handleYachtNext}
            onSkip={handleYachtSkip}
          />
        )}

        {currentStep === "endorsements" && (
          <StepEndorsements
            userId={userId}
            yachtId={yachtId}
            yachtName={yachtName}
            onNext={handleEndorsementsNext}
            onSkip={handleEndorsementsSkip}
          />
        )}

        {currentStep === "done" && (
          <StepDone firstName={firstName} handle={handle} />
        )}
      </div>
    </div>
  );
}
