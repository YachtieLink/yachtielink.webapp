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
    <div className="fixed bottom-[calc(var(--tab-bar-height,4rem)+env(safe-area-inset-bottom,0px))] left-0 right-0 p-4 bg-[var(--color-surface)] border-t border-[var(--color-border)] z-50">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
        <p className="text-sm text-[var(--color-text-secondary)]">
          We use cookies to keep you signed in, understand how the app is used, and fix errors.{' '}
          <Link href="/privacy" className="underline">Learn more</Link>
        </p>
        <button
          onClick={() => { localStorage.setItem('cookie_consent', 'true'); setVisible(false); }}
          className="px-4 py-2 bg-[var(--color-text-primary)] text-[var(--color-surface)] rounded-lg text-sm whitespace-nowrap"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
