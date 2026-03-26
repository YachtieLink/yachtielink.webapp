import Link from 'next/link'

/** Owner-only card for the private profile page. Shows all fields regardless of
 *  show_dob/show_home_country visibility flags (those only affect public output). */
interface PersonalDetailsCardProps {
  dob: string | null
  homeCountry: string | null
  smokePref: string | null
  appearanceNote: string | null
  licenseInfo: string | null
  travelDocs: string[]
}

const SMOKE_LABELS: Record<string, string> = {
  non_smoker: 'Non smoker',
  smoker: 'Smoker',
  social_smoker: 'Social smoker',
}

const APPEARANCE_LABELS: Record<string, string> = {
  none: 'None',
  visible: 'Visible',
  non_visible: 'Non visible',
  not_specified: 'Not specified',
}

function computeAge(dob: string): number {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 86400000))
}

export function PersonalDetailsCard({ dob, homeCountry, smokePref, appearanceNote, licenseInfo, travelDocs }: PersonalDetailsCardProps) {
  const fields: { label: string; value: string }[] = []

  if (dob) fields.push({ label: 'Age', value: `${computeAge(dob)}` })
  if (homeCountry) fields.push({ label: 'Nationality', value: homeCountry })
  if (smokePref) fields.push({ label: 'Smoking', value: SMOKE_LABELS[smokePref] ?? smokePref })
  if (appearanceNote && appearanceNote !== 'not_specified') fields.push({ label: 'Tattoos', value: APPEARANCE_LABELS[appearanceNote] ?? appearanceNote })
  if (licenseInfo) fields.push({ label: 'License', value: licenseInfo })
  if (travelDocs.length > 0) fields.push({ label: 'Visas', value: travelDocs.join(', ') })

  const missingCount = [dob, homeCountry, smokePref].filter(v => !v).length

  return (
    <div className="bg-[var(--color-surface)] rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--color-text-primary)]">Personal Details</span>
        <Link href="/app/profile/settings" className="text-xs text-[var(--color-interactive)] hover:underline">
          {fields.length > 0 ? 'Edit' : 'Add details'}
        </Link>
      </div>

      {fields.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          {fields.map((f) => (
            <div key={f.label} className="flex items-center gap-2 text-sm">
              <span className="text-[var(--color-text-tertiary)] w-20 shrink-0">{f.label}</span>
              <span className="text-[var(--color-text-primary)]">{f.value}</span>
            </div>
          ))}
        </div>
      ) : null}

      {missingCount > 0 && (
        <Link href="/app/profile/settings" className="block">
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2">
            <p className="text-xs font-medium text-amber-900">
              {missingCount} field{missingCount === 1 ? '' : 's'} captains look for {missingCount === 1 ? 'is' : 'are'} missing
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Complete your CV details
            </p>
          </div>
        </Link>
      )}
    </div>
  )
}
