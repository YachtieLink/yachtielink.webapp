"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PageTransition } from "@/components/ui/PageTransition";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
    <PageTransition className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-12 bg-[var(--color-surface)]">
      <div className="text-center">
        <h1 className="text-2xl font-serif text-[var(--color-text-primary)]">
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
            className="rounded-lg bg-[var(--color-error)]/10 px-4 py-3 text-sm text-[var(--color-error)]"
          >
            {error}
          </p>
        )}

        <Input
          label="New password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
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

        <Input
          label="Confirm password"
          type={showConfirm ? "text" : "password"}
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
          suffix={
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />

        <Button type="submit" loading={loading} className="w-full">
          Update password
        </Button>
      </form>
    </PageTransition>
  );
}
