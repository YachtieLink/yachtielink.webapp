import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h2 className="text-xl font-semibold mb-2 text-[var(--foreground)]">Page not found</h2>
      <p className="text-[var(--muted-foreground)] mb-6">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link
        href="/"
        className="px-4 py-2 bg-[var(--foreground)] text-[var(--background)] rounded-lg text-sm"
      >
        Go home
      </Link>
    </div>
  );
}
