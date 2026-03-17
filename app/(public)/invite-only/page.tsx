export default function InviteOnlyPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <div className="max-w-sm w-full">
        <p className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">YachtieLink</p>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mt-8 mb-4">
          Invite only, for now.
        </h1>
        <p className="text-[var(--color-text-secondary)] mb-4 leading-relaxed">
          We&apos;re currently onboarding crew in small batches to keep quality high.
          If you&apos;ve received an invitation, use the link provided.
        </p>
        <p className="text-[var(--color-text-secondary)] text-sm">
          Questions?{' '}
          <a
            href="mailto:ari@yachtie.link"
            className="text-[var(--color-text-primary)] underline"
          >
            ari@yachtie.link
          </a>
        </p>
      </div>
    </div>
  );
}
