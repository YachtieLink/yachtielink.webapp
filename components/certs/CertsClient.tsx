'use client';

import { useState } from 'react';
import Link from 'next/link';

interface CertRow {
  id: string;
  custom_cert_name: string | null;
  issued_at: string | null;
  expiry_date: string | null;
  document_url: string | null;
  certification_types: { name: string; short_name: string | null; category: string | null } | null;
}

type Filter = 'all' | 'valid' | 'expiring' | 'expired';

function getExpiryStatus(expiryDate: string | null): 'valid' | 'expiring' | 'expired' | 'no-expiry' {
  if (!expiryDate) return 'no-expiry';
  const expiry = new Date(expiryDate);
  const now = new Date();
  if (expiry < now) return 'expired';
  const sixtyDays = new Date();
  sixtyDays.setDate(sixtyDays.getDate() + 60);
  if (expiry <= sixtyDays) return 'expiring';
  return 'valid';
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function StatusBadge({ status }: { status: ReturnType<typeof getExpiryStatus> }) {
  if (status === 'no-expiry') return <span className="text-xs text-[var(--muted-foreground)]">No expiry</span>;
  if (status === 'expired') return <span className="text-xs text-red-600 dark:text-red-400 font-medium">● Expired</span>;
  if (status === 'expiring') return <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">⚠ Expiring soon</span>;
  return <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">● Valid</span>;
}

export function CertsClient({
  certs,
  isPro,
}: {
  userId: string;
  certs: CertRow[];
  isPro: boolean;
}) {
  const [filter, setFilter] = useState<Filter>('all');

  const filters: { id: Filter; label: string }[] = [
    { id: 'all',      label: 'All'      },
    { id: 'valid',    label: 'Valid'    },
    { id: 'expiring', label: 'Expiring' },
    { id: 'expired',  label: 'Expired'  },
  ];

  const statuses = certs.map((c) => ({ cert: c, status: getExpiryStatus(c.expiry_date) }));

  const expiringSoon = statuses.filter((s) => s.status === 'expiring');

  const filtered = statuses.filter(({ status }) => {
    if (filter === 'all') return true;
    if (filter === 'valid') return status === 'valid' || status === 'no-expiry';
    return status === filter;
  });

  return (
    <div className="flex flex-col gap-3">
      {/* Expiry alert (Pro only) */}
      {isPro && expiringSoon.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-4">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">
            ⚠ {expiringSoon.length} cert{expiringSoon.length > 1 ? 's' : ''} expiring within 60 days
          </p>
          {expiringSoon.map(({ cert }) => (
            <p key={cert.id} className="text-xs text-amber-700 dark:text-amber-400">
              {cert.certification_types?.name ?? cert.custom_cert_name ?? 'Certificate'} — Expires {formatDate(cert.expiry_date)}
            </p>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      {isPro && (
        <div className="flex gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f.id
                  ? 'bg-[var(--teal-700)] text-white'
                  : 'bg-[var(--muted)] text-[var(--foreground)]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Cert list */}
      {filtered.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-sm text-[var(--muted-foreground)]">
            {filter === 'all' ? 'No certifications yet.' : `No ${filter} certifications.`}
          </p>
          {filter === 'all' && (
            <Link href="/app/certification/new" className="mt-2 inline-block text-sm text-[var(--teal-700)] font-medium">
              Add your first certification
            </Link>
          )}
        </div>
      ) : (
        filtered.map(({ cert, status }) => (
          <div key={cert.id} className="bg-[var(--card)] rounded-2xl p-4">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex-1">
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {cert.certification_types?.name ?? cert.custom_cert_name ?? 'Certificate'}
                </p>
                {cert.certification_types?.category && (
                  <p className="text-xs text-[var(--muted-foreground)]">{cert.certification_types.category}</p>
                )}
              </div>
              {isPro && <StatusBadge status={status} />}
            </div>

            <div className="text-xs text-[var(--muted-foreground)] space-y-0.5 mt-1">
              {cert.issued_at && <p>Issued: {formatDate(cert.issued_at)}</p>}
              {cert.expiry_date && <p>Expires: {formatDate(cert.expiry_date)}</p>}
            </div>

            <div className="flex items-center gap-3 mt-3">
              {cert.document_url ? (
                <>
                  <a
                    href={cert.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-[var(--teal-700)] dark:text-[var(--teal-400)]"
                  >
                    📄 View document
                  </a>
                  <Link
                    href={`/app/certification/${cert.id}/edit`}
                    className="text-xs font-medium text-[var(--muted-foreground)]"
                  >
                    Replace
                  </Link>
                </>
              ) : (
                <Link
                  href={`/app/certification/${cert.id}/edit`}
                  className="text-xs font-medium text-[var(--teal-700)] dark:text-[var(--teal-400)]"
                >
                  📄 Upload document
                </Link>
              )}
              <Link
                href={`/app/certification/${cert.id}/edit`}
                className="ml-auto text-xs font-medium text-[var(--muted-foreground)]"
              >
                Edit
              </Link>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
