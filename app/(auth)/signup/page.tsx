"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PageTransition } from "@/components/ui/PageTransition";

export default function SignupPage() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Pass returnTo through the callback so it's preserved after email confirmation
    const callbackBase = `${window.location.origin}/auth/callback`;
    const callbackUrl = returnTo
      ? `${callbackBase}?next=${encodeURIComponent(returnTo)}`
      : callbackBase;

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: callbackUrl,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
  }

  if (done) {
    return (
      <PageTransition className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-12 bg-[var(--color-surface)]">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-teal-100)] dark:bg-[var(--color-teal-800)]">
          <svg
            className="h-8 w-8 text-[var(--color-teal-700)] dark:text-[var(--color-teal-200)]"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
            />
          </svg>
        </div>
        <div className="text-center">
          <h1 className="text-xl font-serif text-[var(--color-text-primary)]">
            Check your email
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            We sent a confirmation link to{" "}
            <strong className="text-[var(--color-text-primary)]">{email}</strong>
            . Click it to activate your account.
          </p>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-12 bg-[var(--color-surface)]">
      <div className="text-center">
        <h1 className="text-2xl font-serif text-[var(--color-text-primary)]">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Build your portable yachting profile.
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

        <Input
          label="Password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          suffix={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />

        <Button type="submit" loading={loading} className="w-full">
          Create account
        </Button>
      </form>

      <p className="text-sm text-[var(--color-text-secondary)]">
        Already have an account?{" "}
        <Link
          href={`/login${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`}
          className="font-medium text-[var(--color-interactive)] hover:underline"
        >
          Sign in
        </Link>
      </p>
    </PageTransition>
  );
}
