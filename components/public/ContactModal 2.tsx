'use client'

import { Mail, Phone, Share2, User } from 'lucide-react'
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon'
import { SaveProfileButton } from '@/components/profile/SaveProfileButton'
import { SectionModal } from './SectionModal'
import { generateVCard } from '@/lib/vcard'

interface ContactModalProps {
  open: boolean
  onClose: () => void
  user: {
    id: string
    email?: string | null
    phone?: string | null
    whatsapp?: string | null
    show_email?: boolean
    show_phone?: boolean
    show_whatsapp?: boolean
    primary_role?: string | null
  }
  displayName: string
  firstName: string
  profileUrl: string
  isLoggedIn?: boolean
  isOwnProfile?: boolean
  savedStatus?: { id: string; folder_id: string | null } | null
}

export function ContactModal({
  open,
  onClose,
  user,
  displayName,
  firstName,
  profileUrl,
  isLoggedIn,
  isOwnProfile,
  savedStatus,
}: ContactModalProps) {
  return (
    <SectionModal
      title="Contact"
      open={open}
      onClose={onClose}
      footer={
        <div className="flex gap-3">
          {isLoggedIn && !isOwnProfile && (
            <SaveProfileButton
              savedUserId={user.id}
              initialSaved={!!savedStatus}
              initialFolderId={savedStatus?.folder_id}
            />
          )}
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: `${displayName} — YachtieLink`, url: profileUrl })
              } else {
                navigator.clipboard.writeText(profileUrl)
              }
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--accent-500,#0f9b8e)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Share2 size={14} />
            Share
          </button>
          <button
            onClick={() =>
              generateVCard({
                displayName,
                email: user.email,
                phone: user.phone,
                role: user.primary_role,
                profileUrl,
              })
            }
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors"
          >
            <User size={14} />
            Add to Contacts
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        {user.show_email !== false && user.email && (
          <div className="rounded-xl border border-[var(--color-border-subtle)] overflow-hidden">
            <div className="flex items-center gap-3 p-3">
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-surface-raised)]"><Mail size={18} className="text-[var(--color-text-secondary)]" /></span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">Email</p>
                <p className="text-xs text-[var(--color-text-secondary)] truncate">{user.email}</p>
              </div>
            </div>
            <div className="flex border-t border-[var(--color-border-subtle)] divide-x divide-[var(--color-border-subtle)]">
              <a href={`mailto:${user.email}?subject=${encodeURIComponent(`Hey ${firstName}`)}&body=${encodeURIComponent(`Hey ${firstName}, I saw your profile on YachtieLink.\n\n`)}`} className="flex-1 py-2.5 text-center text-xs font-medium text-[var(--accent-500,#0f9b8e)] hover:bg-[var(--color-surface-raised)] transition-colors">Email</a>
              <button onClick={() => { navigator.clipboard.writeText(user.email!) }} className="flex-1 py-2.5 text-center text-xs font-medium text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-raised)] transition-colors">Copy</button>
            </div>
          </div>
        )}
        {user.show_phone !== false && user.phone && (
          <div className="rounded-xl border border-[var(--color-border-subtle)] overflow-hidden">
            <div className="flex items-center gap-3 p-3">
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-surface-raised)]"><Phone size={18} className="text-[var(--color-text-secondary)]" /></span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">Phone</p>
                <p className="text-xs text-[var(--color-text-secondary)] truncate">{user.phone}</p>
              </div>
            </div>
            <div className="flex border-t border-[var(--color-border-subtle)] divide-x divide-[var(--color-border-subtle)]">
              <a href={`tel:${user.phone}`} className="flex-1 py-2.5 text-center text-xs font-medium text-[var(--accent-500,#0f9b8e)] hover:bg-[var(--color-surface-raised)] transition-colors">Call</a>
              <a href={`sms:${user.phone}`} className="flex-1 py-2.5 text-center text-xs font-medium text-[var(--accent-500,#0f9b8e)] hover:bg-[var(--color-surface-raised)] transition-colors">Message</a>
              <button onClick={() => { navigator.clipboard.writeText(user.phone!) }} className="flex-1 py-2.5 text-center text-xs font-medium text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-raised)] transition-colors">Copy</button>
            </div>
          </div>
        )}
        {user.show_whatsapp !== false && user.whatsapp && (
          <div className="rounded-xl border border-[var(--color-border-subtle)] overflow-hidden">
            <div className="flex items-center gap-3 p-3">
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-surface-raised)]"><WhatsAppIcon size={18} className="text-green-600" /></span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">WhatsApp</p>
                <p className="text-xs text-[var(--color-text-secondary)] truncate">{user.whatsapp}</p>
              </div>
            </div>
            <div className="flex border-t border-[var(--color-border-subtle)] divide-x divide-[var(--color-border-subtle)]">
              <a href={`https://wa.me/${user.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex-1 py-2.5 text-center text-xs font-medium text-green-600 hover:bg-[var(--color-surface-raised)] transition-colors">Call</a>
              <a href={`https://wa.me/${user.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex-1 py-2.5 text-center text-xs font-medium text-green-600 hover:bg-[var(--color-surface-raised)] transition-colors">Message</a>
              <button onClick={() => { navigator.clipboard.writeText(user.whatsapp!) }} className="flex-1 py-2.5 text-center text-xs font-medium text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-raised)] transition-colors">Copy</button>
            </div>
          </div>
        )}
      </div>
    </SectionModal>
  )
}
