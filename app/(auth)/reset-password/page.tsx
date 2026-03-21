"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PageTransition } from "@/components/ui/PageTransition";

export default function ResetPasswordPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
      }
    );

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <PageTransition className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-12 bg-[var(--color-surface)]">
        <div className="text-center">
          <h1 className="text-2xl font-serif text-[var(--color-text-primary)]">
            Check your email
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            We sent a password reset link to{" "}
            <span className="font-medium text-[var(--color-text-primary)]">
              {email}
            </span>
            .
          </p>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            The link expires in 1 hour.
          </p>
        </div>
        <Link
          href="/login"
          className="text-sm font-medium text-[var(--color-interactive)] hover:underline"
        >
          Back to sign in
        </Link>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-12 bg-[var(--color-surface)]">
      <div className="text-center">
        <h1 className="text-2xl font-serif text-[var(--color-text-primary)]">
          Reset your password
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4"
      >
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-[var(--color-error)]/10 px-4 py-3 text-sm text-[var(--color-error)]"
          >
            {error}
          </p>
        )}

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />

        <Button type="submit" loading={loading} className="w-full">
          Send reset link
        </Button>
      </form>

      <p className="text-sm text-[var(--color-text-secondary)]">
        Remember it?{" "}
        <Link
          href="/login"
          className="font-medium text-[var(--color-interactive)] hover:underline"
        >
          Sign in
        </Link>
      </p>
    </PageTransition>
  );
}
