'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  User, Anchor, Shield, GraduationCap, Heart, Wrench,
  MessageSquareQuote, ChevronDown, ChevronUp,
} from 'lucide-react'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { MiniBentoGallery } from '../MiniBentoGallery'
import type {
  PublicAttachment, PublicCertification, PublicEndorsement,
  GalleryItem, Hobby, Education, Skill,
} from '@/lib/queries/types'

interface PortfolioLayoutProps {
  user: {
    id: string
    handle: string
    bio?: string | null
    ai_summary?: string | null
    cv_public?: boolean
    cv_public_source?: string
    latest_pdf_path?: string | null
    cv_storage_path?: string | null
  }
  attachments: PublicAttachment[]
  certifications: PublicCertification[]
  endorsements: PublicEndorsement[]
  education: Education[]
  skills: Skill[]
  hobbies: Hobby[]
  gallery: GalleryItem[]
  accentColor: string
  handle: string
  isLoggedIn?: boolean
  sectionVisibility: Record<string, boolean>
}

function sectionVisible(visibility: Record<string, boolean>, key: string, hasData: boolean): boolean {
  return visibility[key] !== false && hasData
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

function SectionCard({ title, icon, children, accentColor }: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  accentColor?: string
}) {
  return (
    <ScrollReveal>
      <div className="rounded-xl bg-white/80 p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[var(--color-text-tertiary)]" style={accentColor ? { color: `var(--accent-500, ${accentColor})` } : undefined}>
            {icon}
          </span>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
            {title}
          </h2>
        </div>
        {children}
      </div>
    </ScrollReveal>
  )
}

function AboutSection({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div>
      <p className={`text-sm text-[var(--color-text-primary)] leading-relaxed whitespace-pre-line ${!expanded ? 'line-clamp-3' : ''}`}>
        {text}
      </p>
      {text.split('\n').length >= 3 || text.length > 200 ? (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs font-medium text-[var(--accent-500,var(--color-interactive))] hover:underline flex items-center gap-1"
        >
          {expanded ? (
            <>Show less <ChevronUp size={12} /></>
          ) : (
            <>Read more <ChevronDown size={12} /></>
          )}
        </button>
      ) : null}
    </div>
  )
}

export function PortfolioLayout({
  user,
  attachments,
  certifications,
  endorsements,
  education,
  skills,
  hobbies,
  gallery,
  accentColor,
  handle,
  isLoggedIn,
  sectionVisibility,
}: PortfolioLayoutProps) {
  const aboutText = user.ai_summary || user.bio

  // Gallery photos from user_gallery (work portfolio), take first 3 for mini bento
  const galleryPhotos = gallery
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .slice(0, 3)

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-24 max-w-[680px] mx-auto w-full">
      {/* About */}
      {sectionVisible(sectionVisibility, 'about', !!aboutText) && (
        <SectionCard title="About" icon={<User size={16} />}>
          <AboutSection text={aboutText!} />
        </SectionCard>
      )}

      {/* Experience — compact yacht cards */}
      {sectionVisible(sectionVisibility, 'experience', attachments.length > 0) && (
        <SectionCard title="Experience" icon={<Anchor size={16} />} accentColor="#3b82f6">
          <div className="flex flex-col gap-3">
            {attachments.slice(0, 3).map((att) => (
              <div key={att.id} className="flex gap-3">
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--accent-500,var(--color-interactive))]" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    {att.yachts?.name ?? 'Unknown Yacht'}
                    {att.role_label && <span className="font-normal text-[var(--color-text-secondary)]"> — {att.role_label}</span>}
                  </p>
                  {(att.started_at || att.ended_at) && (
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {formatDate(att.started_at)}{att.started_at && ' – '}{att.ended_at ? formatDate(att.ended_at) : 'Present'}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          {attachments.length > 3 && (
            <Link
              href={`/u/${handle}/experience`}
              className="mt-3 block text-xs font-medium text-[var(--accent-500,var(--color-interactive))] hover:underline"
            >
              See all {attachments.length} positions &rarr;
            </Link>
          )}
        </SectionCard>
      )}

      {/* Endorsements */}
      {sectionVisible(sectionVisibility, 'endorsements', endorsements.length > 0) && (
        <SectionCard title="Endorsements" icon={<MessageSquareQuote size={16} />} accentColor="#f97066">
          <div className="flex flex-col gap-3">
            {endorsements.slice(0, 3).map((end) => (
              <div key={end.id} className="border-l-2 border-[var(--color-border)] pl-3">
                <p className="text-sm text-[var(--color-text-primary)] italic line-clamp-3">
                  &ldquo;{end.content}&rdquo;
                </p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  — {end.endorser?.display_name || end.endorser?.full_name || 'Anonymous'}
                  {end.yacht?.name && <span className="text-[var(--color-text-tertiary)]"> on {end.yacht.name}</span>}
                </p>
              </div>
            ))}
          </div>
          <Link
            href={`/u/${handle}/endorsements`}
            className="mt-3 block text-xs font-medium text-[var(--accent-500,var(--color-interactive))] hover:underline"
          >
            See all {endorsements.length} endorsements &rarr;
          </Link>
        </SectionCard>
      )}

      {/* Certifications — chip display */}
      {sectionVisible(sectionVisibility, 'certifications', certifications.length > 0) && (
        <SectionCard title="Certifications" icon={<Shield size={16} />} accentColor="#f59e0b">
          <div className="flex flex-wrap gap-2">
            {certifications.map((cert) => {
              const name = cert.certification_types?.name ?? cert.custom_cert_name ?? 'Certificate'
              return (
                <span
                  key={cert.id}
                  className="text-xs px-3 py-1.5 rounded-full bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] border border-[var(--color-border-subtle)]"
                >
                  {name}
                </span>
              )
            })}
          </div>
          <Link
            href={`/u/${handle}/certifications`}
            className="mt-3 block text-xs font-medium text-[var(--accent-500,var(--color-interactive))] hover:underline"
          >
            See all certifications &rarr;
          </Link>
        </SectionCard>
      )}

      {/* Education */}
      {sectionVisible(sectionVisibility, 'education', education.length > 0) && (
        <SectionCard title="Education" icon={<GraduationCap size={16} />}>
          <div className="flex flex-col gap-3">
            {education.slice(0, 3).map((edu) => (
              <div key={edu.id}>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">{edu.institution}</p>
                {edu.qualification && <p className="text-sm text-[var(--color-text-secondary)]">{edu.qualification}</p>}
                {edu.field_of_study && <p className="text-xs text-[var(--color-text-secondary)]">{edu.field_of_study}</p>}
                {(edu.started_at || edu.ended_at) && (
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {edu.started_at ? new Date(edu.started_at).getFullYear() : ''}
                    {edu.started_at && edu.ended_at ? ' – ' : ''}
                    {edu.ended_at ? new Date(edu.ended_at).getFullYear() : ''}
                  </p>
                )}
              </div>
            ))}
          </div>
          {education.length > 3 && (
            <Link
              href={`/u/${handle}/education`}
              className="mt-3 block text-xs font-medium text-[var(--accent-500,var(--color-interactive))] hover:underline"
            >
              See all education &rarr;
            </Link>
          )}
        </SectionCard>
      )}

      {/* Skills */}
      {sectionVisible(sectionVisibility, 'skills', skills.length > 0) && (
        <SectionCard title="Skills" icon={<Wrench size={16} />}>
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <span
                key={s.id}
                className="text-xs px-3 py-1.5 rounded-full bg-[var(--color-surface-raised)] text-[var(--color-text-primary)]"
              >
                {s.name}
              </span>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Hobbies */}
      {sectionVisible(sectionVisibility, 'hobbies', hobbies.length > 0) && (
        <SectionCard title="Hobbies" icon={<Heart size={16} />}>
          <div className="flex flex-wrap gap-2">
            {hobbies.map((h) => (
              <span
                key={h.id}
                className="text-sm px-3 py-1.5 rounded-full bg-[var(--color-surface-raised)] text-[var(--color-text-primary)]"
              >
                {h.emoji ? `${h.emoji} ${h.name}` : h.name}
              </span>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Mini Bento Gallery — asymmetric layout with lightbox */}
      {sectionVisible(sectionVisibility, 'photos', galleryPhotos.length > 0) && (
        <MiniBentoGallery
          photos={galleryPhotos.map((p) => ({
            id: p.id,
            url: p.image_url,
            focal_x: 50,
            focal_y: 50,
          }))}
          handle={handle}
          totalPhotoCount={gallery.length}
        />
      )}

      {/* Bottom CTA for non-logged-in viewers */}
      {!isLoggedIn && (
        <Link
          href="/signup"
          className="w-full flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          style={{ backgroundColor: 'var(--accent-500, var(--color-interactive))' }}
        >
          Build your crew profile — it&apos;s free
        </Link>
      )}
    </div>
  )
}
