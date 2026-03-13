"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    router.push("/app/profile");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-12 bg-[var(--color-surface)]">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Choose a new password
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Must be at least 8 characters.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4"
      >
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400"
          >
            {error}
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="password"
            className="text-sm font-medium text-[var(--color-text-primary)]"
          >
            New password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-interactive)] focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]/20"
            placeholder="••••••••"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="confirm"
            className="text-sm font-medium text-[var(--color-text-primary)]"
          >
            Confirm password
          </label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="h-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-interactive)] focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]/20"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex h-12 w-full items-center justify-center rounded-xl bg-[var(--color-navy-800)] text-sm font-semibold text-white transition-colors hover:bg-[var(--color-navy-900)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
