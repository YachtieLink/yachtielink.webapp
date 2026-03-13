/**
 * /r/:token — Endorsement request deep link (Sprint 5)
 *
 * Unauthenticated → auth → back here
 * Authenticated   → write endorsement
 */
export default function EndorsementRequestPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface)] p-4">
      <p className="text-sm text-[var(--color-text-secondary)]">
        Endorsement request flow — Sprint 5.
      </p>
    </div>
  );
}
