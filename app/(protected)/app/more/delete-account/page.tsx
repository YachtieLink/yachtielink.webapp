'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DeleteAccountPage() {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const REQUIRED = 'DELETE MY ACCOUNT';
  const confirmed = confirmation === REQUIRED;

  async function handleDelete() {
    if (!confirmed) return;
    setLoading(true);
    setError(null);

    const res = await fetch('/api/account/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmation }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Something went wrong. Please try again.');
      setLoading(false);
      return;
    }

    // Account deleted — redirect to welcome
    router.push('/welcome');
  }

  return (
    <div className="flex flex-col max-w-sm mx-auto px-4 py-8 pb-24">
      <Link
        href="/app/more"
        className="text-sm text-[var(--muted-foreground)] mb-6 inline-flex items-center gap-1"
      >
        ← Back
      </Link>

      <h1 className="text-xl font-semibold text-[var(--foreground)] mb-2">Delete Your Account</h1>
      <p className="text-sm text-[var(--muted-foreground)] mb-6 leading-relaxed">
        This will permanently delete your account and all associated data.
      </p>

      <div className="bg-[var(--card)] rounded-2xl p-5 mb-6 space-y-2">
        <p className="text-sm font-medium text-[var(--foreground)]">What happens:</p>
        <ul className="text-sm text-[var(--muted-foreground)] space-y-1 list-disc list-inside">
          <li>Your profile, photos, and documents are deleted</li>
          <li>Your certifications are removed</li>
          <li>Your employment history is removed</li>
          <li>Endorsements you&apos;ve written will show &ldquo;[Deleted User]&rdquo;</li>
          <li>Your Pro subscription (if active) is cancelled</li>
        </ul>
        <p className="text-sm font-semibold text-red-500 pt-1">This cannot be undone.</p>
      </div>

      <div className="mb-6">
        <label className="text-sm text-[var(--muted-foreground)] mb-2 block">
          Type <span className="font-mono font-semibold text-[var(--foreground)]">{REQUIRED}</span> to confirm:
        </label>
        <input
          type="text"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          placeholder={REQUIRED}
          className="w-full px-4 py-3 rounded-xl bg-[var(--muted)] text-[var(--foreground)] text-sm border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      {error && (
        <p className="text-sm text-red-500 mb-4">{error}</p>
      )}

      <button
        onClick={handleDelete}
        disabled={!confirmed || loading}
        className="w-full py-3 rounded-xl text-sm font-semibold bg-red-500 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-600 transition-colors mb-3"
      >
        {loading ? 'Deleting…' : 'Delete Account'}
      </button>

      <Link
        href="/app/more"
        className="w-full py-3 rounded-xl text-sm font-semibold text-center text-[var(--foreground)] bg-[var(--muted)] hover:bg-[var(--muted)]/70 transition-colors"
      >
        Cancel
      </Link>
    </div>
  );
}
