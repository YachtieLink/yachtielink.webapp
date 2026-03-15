'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ManagePortalButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleManage() {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) router.push(data.url);
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleManage}
      disabled={loading}
      className="w-full py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)]/40 disabled:opacity-60 transition-colors"
    >
      {loading ? 'Redirecting…' : 'Manage Subscription'}
    </button>
  );
}
