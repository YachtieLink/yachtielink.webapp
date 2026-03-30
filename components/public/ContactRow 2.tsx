import { Mail, Phone } from 'lucide-react'
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon'

interface ContactRowProps {
  email?: string | null
  phone?: string | null
  whatsapp?: string | null
  showEmail?: boolean
  showPhone?: boolean
  showWhatsapp?: boolean
  firstName: string
  /** If provided, tapping any icon opens the contact modal instead of direct action */
  onTap?: () => void
}

export function ContactRow({
  email,
  phone,
  whatsapp,
  showEmail,
  showPhone,
  showWhatsapp,
  firstName,
  onTap,
}: ContactRowProps) {
  const hasAny =
    (showEmail && email) || (showPhone && phone) || (showWhatsapp && whatsapp)

  if (!hasAny) return null

  // Match Rich Portfolio styling exactly
  const iconClass = "flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:text-[var(--accent-500,#14b8a6)] transition-colors"

  if (onTap) {
    return (
      <button onClick={onTap} className="flex gap-3">
        {showEmail && email && (
          <span className={iconClass}><Mail size={18} /></span>
        )}
        {showPhone && phone && (
          <span className={iconClass}><Phone size={18} /></span>
        )}
        {showWhatsapp && whatsapp && (
          <span className={iconClass}><WhatsAppIcon size={18} /></span>
        )}
      </button>
    )
  }

  return (
    <div className="flex gap-3">
      {showEmail && email && (
        <a
          href={`mailto:${email}?subject=${encodeURIComponent(`Hey ${firstName}`)}&body=${encodeURIComponent(`Hey ${firstName}, I saw your profile on YachtieLink.\n\n`)}`}
          className={iconClass}
          aria-label="Email"
        >
          <Mail size={18} />
        </a>
      )}
      {showPhone && phone && (
        <a href={`tel:${phone}`} className={iconClass} aria-label="Phone">
          <Phone size={18} />
        </a>
      )}
      {showWhatsapp && whatsapp && (
        <a
          href={`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hey ${firstName}, I saw your profile on YachtieLink. `)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={iconClass}
          aria-label="WhatsApp"
        >
          <WhatsAppIcon size={18} />
        </a>
      )}
    </div>
  )
}
