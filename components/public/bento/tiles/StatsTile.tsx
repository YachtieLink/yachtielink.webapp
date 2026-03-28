'use client'

interface StatsTileProps {
  displayName: string
  seaTime: string
  yachtCount: number
  certCount: number
  endorsementCount: number
  colleagueCount: number
  onClickSection?: (section: string) => void
}

export function StatsTile({ displayName, seaTime, yachtCount, certCount, endorsementCount, colleagueCount, onClickSection }: StatsTileProps) {
  const firstName = displayName.split(' ')[0]

  function Tap({ section, children }: { section: string; children: React.ReactNode }) {
    return onClickSection ? (
      <button onClick={(e) => { e.stopPropagation(); onClickSection(section) }} className="font-semibold text-[var(--color-text-primary)] hover:text-[var(--accent-500,#14b8a6)] transition-colors">
        {children}
      </button>
    ) : (
      <span className="font-semibold text-[var(--color-text-primary)]">{children}</span>
    )
  }

  return (
    <div className="h-full rounded-xl bg-gradient-to-br from-[var(--accent-100,#ccfbf1)]/40 to-white/60 p-6 flex items-center">
      <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed tracking-wide">
        {firstName} has spent <Tap section="experience">{seaTime}</Tap> working at sea
        {yachtCount > 0 && <> across <Tap section="experience">{yachtCount} {yachtCount === 1 ? 'yacht' : 'yachts'}</Tap></>}
        {certCount > 0 && <>, holds <Tap section="certifications">{certCount} {certCount === 1 ? 'certification' : 'certifications'}</Tap></>}
        {colleagueCount > 0 && <> and has worked with <Tap section="colleagues">{colleagueCount} {colleagueCount === 1 ? 'colleague' : 'colleagues'}</Tap></>}
        {endorsementCount > 0 && <>, of which <Tap section="endorsements">{endorsementCount}</Tap> have endorsed her</>}
        .
      </p>
    </div>
  )
}
