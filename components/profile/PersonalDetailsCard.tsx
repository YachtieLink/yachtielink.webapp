import Link from 'next/link'

/** Owner-only card for the private profile page.
 *  Shows profile-relevant personal details (age, nationality).
 *  CV-only fields (smoking, tattoos, license, visas) are on the CV tab. */
interface PersonalDetailsCardProps {
  dob: string | null
  homeCountry: string | null
  smokePref: string | null
  appearanceNote: string | null
  licenseInfo: string | null
  travelDocs: string[]
}

function computeAge(dob: string): number {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 86400000))
}

export function PersonalDetailsCard({ dob, homeCountry, smokePref, appearanceNote, licenseInfo, travelDocs }: PersonalDetailsCardProps) {
  const profileFields: { label: string; value: string }[] = []

  if (dob) profileFields.push({ label: 'Age', value: `${computeAge(dob)}` })
  if (homeCountry) profileFields.push({ label: 'Nationality', value: homeCountry })

  const cvFieldCount = [smokePref, appearanceNote !== 'not_specified' ? appearanceNote : null, licenseInfo, travelDocs.length > 0 ? 'yes' : null].filter(Boolean).length
  const missingProfileCount = [dob, homeCountry].filter(v => !v).length

  return (
    <div className="bg-[var(--color-surface)] rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--color-text-primary)]">Personal Details</span>
        <Link href="/app/profile/settings" className="text-xs text-[var(--color-interactive)] hover:underline">
          {profileFields.length > 0 ? 'Edit' : 'Add details'}
        </Link>
      </div>

      {profileFields.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {profileFields.map((f) => (
            <div key={f.label} className="flex items-center gap-2 text-sm">
              <span className="text-[var(--color-text-tertiary)] w-20 shrink-0">{f.label}</span>
              <span className="text-[var(--color-text-primary)]">{f.value}</span>
            </div>
          ))}
        </div>
      )}

      {cvFieldCount > 0 && (
        <p className="text-xs text-[var(--color-text-tertiary)]">
          {cvFieldCount} CV detail{cvFieldCount === 1 ? '' : 's'} set —{' '}
          <Link href="/app/cv" className="text-[var(--color-interactive)] hover:underline">
            edit on CV tab
          </Link>
        </p>
      )}

      {missingProfileCount > 0 && (
        <Link href="/app/profile/settings" className="block">
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2">
            <p className="text-xs font-medium text-amber-900">
              {missingProfileCount} field{missingProfileCount === 1 ? '' : 's'} that hirers look for {missingProfileCount === 1 ? 'is' : 'are'} missing
            </p>
          </div>
        </Link>
      )}
    </div>
  )
}
