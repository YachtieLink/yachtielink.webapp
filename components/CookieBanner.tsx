'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('cookie_consent')) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--card)] border-t border-[var(--border)] z-50">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
        <p className="text-sm text-[var(--muted-foreground)]">
          We use essential cookies for authentication. No tracking cookies.{' '}
          <Link href="/privacy" className="underline">Privacy Policy</Link>
        </p>
        <button
          onClick={() => { localStorage.setItem('cookie_consent', 'true'); setVisible(false); }}
          className="px-4 py-2 bg-[var(--foreground)] text-[var(--background)] rounded-lg text-sm whitespace-nowrap"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
