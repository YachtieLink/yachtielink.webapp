"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { uploadCV } from "@/lib/storage/upload";
import { saveParsedCvData, type ParsedCvData, type SaveStats } from "@/lib/cv/save-parsed-cv-data";

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

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = ["cv-upload", "name", "handle", "done"] as const;
type Step = (typeof STEPS)[number];

const HANDLE_REGEX = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;

const ALLOWED_CV_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_CV_SIZE = 10 * 1024 * 1024;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStartingStep(data: WizardProps["initialData"]): number {
  if (data.handle) return 3; // already has handle → done
  if (data.full_name) return 2; // has name but no handle → handle step
  return 0; // start at cv-upload
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
              ? "bg-[var(--color-teal-700)]"
              : i === current
                ? "bg-[var(--color-teal-700)] opacity-50"
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

// ─── Step 1: CV Upload ───────────────────────────────────────────────────────

function StepCvUpload({
  userId,
  onComplete,
  onSkip,
}: {
  userId: string;
  onComplete: (data: ParsedCvData, stats: SaveStats) => void;
  onSkip: () => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [phase, setPhase] = useState<"idle" | "uploading" | "parsing" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [stats, setStats] = useState<SaveStats | null>(null);
  const [parsedData, setParsedData] = useState<ParsedCvData | null>(null);
  const supabase = createClient();

  async function processFile(file: File) {
    // Client-side validation
    if (!ALLOWED_CV_TYPES.includes(file.type)) {
      setErrorMessage("Only PDF and DOCX files are accepted.");
      setPhase("error");
      return;
    }
    if (file.size > MAX_CV_SIZE) {
      setErrorMessage("File must be under 10 MB.");
      setPhase("error");
      return;
    }

    // Upload
    setPhase("uploading");
    const uploadResult = await uploadCV(userId, file);
    if (!uploadResult.ok) {
      setErrorMessage(uploadResult.error);
      setPhase("error");
      return;
    }

    // Parse
    setPhase("parsing");
    try {
      const res = await fetch("/api/cv/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storagePath: uploadResult.storagePath }),
      });

      if (res.status === 429) {
        setErrorMessage("You've used your uploads for today. Add details manually for now.");
        setPhase("error");
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrorMessage(body.error || "Couldn't read that file. Try a different one, or add details manually.");
        setPhase("error");
        return;
      }

      const { data } = await res.json();
      const parsed = data as ParsedCvData;

      if (!parsed.full_name && !parsed.employment_history?.length && !parsed.certifications?.length) {
        setErrorMessage("We couldn't find much in that file. Try a different one, or add details manually.");
        setPhase("error");
        return;
      }

      // Save — auto-generate handle + save all data
      setPhase("saving");
      setParsedData(parsed);

      // Generate handle from parsed name
      const nameForHandle = parsed.full_name || "user";
      let autoHandle = "";

      try {
        const { data: suggestions } = await supabase.rpc("suggest_handles", {
          p_full_name: nameForHandle,
        });
        if (suggestions && suggestions.length > 0) {
          // Check each suggestion for availability
          for (const suggestion of suggestions as string[]) {
            const { data: isAvailable } = await supabase.rpc("handle_available", {
              p_handle: suggestion,
            });
            if (isAvailable) {
              autoHandle = suggestion;
              break;
            }
          }
        }
      } catch {
        // Non-critical — fall through to fallback
      }

      // Fallback handle if nothing worked
      if (!autoHandle) {
        autoHandle = `user-${Math.random().toString(36).slice(2, 8)}`;
      }

      const displayName = parsed.full_name?.split(" ")[0] ?? "";

      const saveResult = await saveParsedCvData(supabase, userId, parsed, {
        additionalUserFields: {
          handle: autoHandle,
          display_name: displayName,
          onboarding_complete: true,
          cv_parsed_at: new Date().toISOString(),
        },
      });

      if (!saveResult.ok) {
        setErrorMessage("Something went wrong saving your data. Let's try the manual route.");
        setPhase("error");
        return;
      }

      setStats(saveResult.stats);
      onComplete(parsed, saveResult.stats);
    } catch {
      setErrorMessage("Something went wrong. Try a different file, or add details manually.");
      setPhase("error");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function resetToIdle() {
    setPhase("idle");
    setErrorMessage("");
    setStats(null);
    setParsedData(null);
  }

  // ── Loading screen ──
  if (phase === "uploading" || phase === "parsing" || phase === "saving") {
    const messages = {
      uploading: "Uploading…",
      parsing: "Reading your CV…",
      saving: "Setting up your profile…",
    };

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-[var(--color-teal-700)] border-t-transparent" />
        <p className="text-base font-medium text-[var(--color-text-primary)]">
          {messages[phase]}
        </p>
        <p className="text-sm text-[var(--color-text-tertiary)]">
          This usually takes a few seconds
        </p>
      </div>
    );
  }

  // ── Error state ──
  if (phase === "error") {
    return (
      <StepShell title="Hmm, that didn't work" subtitle={errorMessage}>
        <div className="flex flex-col gap-3">
          <Button onClick={resetToIdle} className="w-full" size="lg">
            Try a different file
          </Button>
          <button
            onClick={onSkip}
            className="w-full text-center text-sm text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-text-primary)]"
          >
            Skip — I&apos;ll add my details manually
          </button>
        </div>
      </StepShell>
    );
  }

  // ── Idle — upload zone ──
  return (
    <StepShell
      title="Got a CV handy?"
      subtitle="Drop it here and we'll set up your profile for you."
    >
      <label
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-12 cursor-pointer transition-colors ${
          dragOver
            ? "border-[var(--color-interactive)] bg-[var(--color-surface-overlay)]"
            : "border-[var(--color-border)] bg-[var(--color-surface-raised)] hover:border-[var(--color-interactive-muted)]"
        }`}
      >
        <svg
          className="h-10 w-10 text-[var(--color-text-tertiary)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>
        <p className="text-sm font-medium text-[var(--color-text-primary)]">
          Drag & drop your CV here
        </p>
        <p className="text-xs text-[var(--color-text-tertiary)]">
          or tap to browse files
        </p>
        <p className="text-xs text-[var(--color-text-tertiary)]">
          PDF or DOCX · Max 10 MB
        </p>
        <input
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>

      <button
        onClick={onSkip}
        className="w-full text-center text-sm text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-text-primary)]"
      >
        Skip — I&apos;ll add my details manually
      </button>
    </StepShell>
  );
}

// ─── Step 2: Name ─────────────────────────────────────────────────────────────

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

// ─── Step 3: Handle ───────────────────────────────────────────────────────────

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

// ─── Step 4: Done ─────────────────────────────────────────────────────────────

function StepDone({
  firstName,
  handle,
}: {
  firstName: string;
  handle: string;
}) {
  return (
    <StepShell title={`Welcome aboard, ${firstName}!`}>
      <div className="flex flex-col gap-3 text-sm text-[var(--color-text-tertiary)]">
        <p>Your profile is live. Here&apos;s what you can do next:</p>
        <ul className="space-y-2 pl-1">
          <li>
            🔗 Your public link:{" "}
            <strong className="text-[var(--color-text-primary)]">
              yachtie.link/u/{handle}
            </strong>
          </li>
          <li>📋 Fine-tune your details on your profile page</li>
          <li>⭐ Request endorsements from colleagues you&apos;ve worked with</li>
        </ul>
      </div>

      <div className="flex flex-col items-center gap-2 pt-2">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--color-teal-700)] border-t-transparent" />
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
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear redirect timer on unmount
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  const VISIBLE_STEPS = STEPS.length - 1; // exclude "done" from progress count

  async function saveToDb(updates: Record<string, unknown>) {
    await supabase.from("users").update(updates).eq("id", userId);
  }

  // ── Step handlers ────────────────────────────────────────────────────────

  function handleCvComplete(data: ParsedCvData, _stats: SaveStats) {
    // Everything already saved by StepCvUpload (including handle + onboarding_complete)
    const name = data.full_name ?? "";
    setFullName(name);
    setDisplayName(name.split(" ")[0]);
    // Go straight to done
    setStepIndex(3);
    if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    redirectTimerRef.current = setTimeout(() => router.push("/app/profile"), 2200);
  }

  function handleCvSkip() {
    // Manual path — go to name step
    setStepIndex(1);
  }

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
    setStepIndex(2);
  }

  async function handleHandleNext(data: { handle: string }) {
    setHandle(data.handle);
    await saveToDb({ handle: data.handle, onboarding_complete: true });
    setStepIndex(3);
    if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    redirectTimerRef.current = setTimeout(() => router.push("/app/profile"), 2200);
  }

  const currentStep = STEPS[stepIndex];
  const firstName = fullName.split(" ")[0] || "there";

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col">
      {/* Progress bar — hidden on done screen and cv-upload (which has its own loading UX) */}
      {currentStep !== "done" && currentStep !== "cv-upload" && (
        <>
          <ProgressBar current={stepIndex - 1} total={2} />
          <div className="px-6 pt-3">
            <p className="text-xs font-medium uppercase tracking-widest text-[var(--color-text-tertiary)]">
              Step {stepIndex} of 2
            </p>
          </div>
        </>
      )}

      {/* Step content */}
      <div className="flex-1 px-6 py-8">
        {currentStep === "cv-upload" && (
          <StepCvUpload
            userId={userId}
            onComplete={handleCvComplete}
            onSkip={handleCvSkip}
          />
        )}

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

        {currentStep === "done" && (
          <StepDone firstName={firstName} handle={handle} />
        )}
      </div>
    </div>
  );
}
